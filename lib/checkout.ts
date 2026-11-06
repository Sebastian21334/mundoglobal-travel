import { randomBytes } from "node:crypto";
import { catalogo } from "./datos/catalogos";
import { codigoDestino } from "./datos/destinos";
import type { Busqueda, Confirmacion, Cotizacion, Escenario, Oferta, Pago, Seleccion, Validacion } from "./dominio";
import { escenarios } from "./dominio";
import { calcularPrecios, errorBusqueda } from "./precios";
import { firmar, referencia, verificar } from "./tokens";

export const vigenciaMs = 10 * 60_000;
type Recibo = { id: string; pago: string; total: number; escenario: Escenario; reintento: boolean; vence: number };

const empaquetar = (cotizacion: Cotizacion): Oferta => ({ cotizacion, token: firmar("cotizacion", cotizacion) });
export const esEscenario = (valor: unknown): valor is Escenario =>
  typeof valor === "string" && Object.hasOwn(escenarios, valor);

function cotizacionVigente(token: unknown, ahora: number) {
  const cotizacion = verificar<Cotizacion>("cotizacion", token);
  if (cotizacion.vence <= ahora) throw new Error("La cotización venció. Actualizá los precios para continuar.");
  return cotizacion;
}

export function cotizar(busqueda: Busqueda, seleccion: Seleccion, anterior?: unknown, ahora = Date.now(), renovar = false): Oferta {
  const error = errorBusqueda(busqueda);
  if (error) throw new Error(error);
  const previa = anterior ? verificar<Cotizacion>("cotizacion", anterior) : undefined;
  if (previa && previa.vence <= ahora && !renovar) throw new Error("La cotización venció. Actualizá los precios para continuar.");
  if (previa && (previa.busqueda.ida !== busqueda.ida || previa.busqueda.vuelta !== busqueda.vuelta ||
      previa.busqueda.origen !== busqueda.origen || previa.busqueda.pasajeros !== busqueda.pasajeros ||
      codigoDestino(previa.busqueda) !== codigoDestino(busqueda))) {
    throw new Error("Iniciá otra búsqueda para cambiar el destino, las fechas, el origen o los viajeros.");
  }
  const recargo = previa?.seleccion.vuelo === seleccion?.vuelo ? previa.recargo : 0;
  const precios = calcularPrecios(busqueda, catalogo(busqueda), seleccion, recargo);
  return empaquetar({
    id: previa?.id ?? "MGT-2026-" + randomBytes(3).toString("hex").toUpperCase(),
    busqueda: { ...busqueda, destino: codigoDestino(busqueda) }, seleccion, precios, recargo, vence: renovar ? ahora + vigenciaMs : previa?.vence ?? ahora + vigenciaMs,
    validada: false,
  });
}

export function validar(token: unknown, escenario: Escenario, ahora = Date.now()): Validacion {
  const actual = cotizacionVigente(token, ahora);
  if (escenario !== "tarifa" || actual.recargo > 0 || actual.validada) {
    return { tipo: "lista", oferta: empaquetar({ ...actual, validada: true }) };
  }
  const { busqueda, seleccion } = actual;
  const opciones = catalogo(busqueda);
  const recargo = 3500;
  const alterna = opciones.vuelos.find(vuelo => vuelo.id !== seleccion.vuelo)!;
  const alternativa = { ...seleccion, vuelo: alterna.id };
  return {
    tipo: "cambio", anterior: actual.precios.total,
    detalle: "El proveedor aéreo actualizó la tarifa en USD 35,00 por viajero. Hotel y asistencia conservan su precio.",
    oferta: empaquetar({ ...actual, recargo, validada: true, precios: calcularPrecios(busqueda, opciones, seleccion, recargo) }),
    alternativa: empaquetar({
      ...actual, seleccion: alternativa, validada: true, precios: calcularPrecios(busqueda, opciones, alternativa),
    }),
  };
}

export function autorizar(token: unknown, clave: unknown, escenario: Escenario, reintento: boolean, ahora = Date.now()): Pago {
  const cotizacion = cotizacionVigente(token, ahora);
  if (!cotizacion.validada) throw new Error("Validá la cotización antes de autorizar el pago.");
  if (typeof clave !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(clave)) {
    throw new Error("El intento de pago no tiene una clave válida.");
  }
  if (escenario === "rechazado") {
    return { aprobado: false, proveedor: "Pasarela simulada", detalle: "La pasarela rechazó la autorización. No se debitó ningún importe." };
  }
  // Una repetición devuelve la misma autorización sin memoria de servidor ni efectos externos.
  const pago = referencia("AUT", cotizacion.id + ":" + clave + ":" + String(token) + ":" + escenario + ":" + reintento);
  const recibo = firmar<Recibo>("pago", {
    id: cotizacion.id, pago, total: cotizacion.precios.total, escenario, reintento, vence: cotizacion.vence + 30 * 60_000,
  });
  return { aprobado: true, recibo, autorizacion: pago };
}

export function confirmar(recibo: unknown, id: unknown, ahora = Date.now()): Confirmacion {
  const pago = verificar<Recibo>("pago", recibo);
  if (pago.id !== id) throw new Error("La autorización pertenece a otra reserva.");
  if (pago.vence <= ahora) return {
    emitida: false, proveedor: "Pasarela simulada", etapa: "Autorización",
    detalle: "La autorización venció y se liberó. Podés revalidar la reserva y volver a intentar.", liberados: [pago.pago],
  };
  const vuelo = referencia("VUE", pago.pago);
  const hotel = referencia("HOT", pago.pago);
  if (pago.escenario === "parcial") {
    return {
      emitida: false, proveedor: "Asistencia al viajero", etapa: "Confirmación",
      detalle: "El proveedor de asistencia no confirmó el servicio. La autorización y los cupos confirmados fueron liberados.",
      liberados: [pago.pago, vuelo, hotel],
    };
  }
  const asistencia = referencia("ASI", pago.pago);
  if (pago.escenario === "recuperacion" && !pago.reintento) {
    return {
      emitida: false, proveedor: "Pasarela simulada", etapa: "Captura",
      detalle: "Los tres servicios respondieron, pero falló la captura. Se liberaron la autorización y los tres servicios. Podés reintentar desde la reserva.",
      liberados: [pago.pago, vuelo, hotel, asistencia],
    };
  }
  return { emitida: true, referencias: { vuelo, hotel, asistencia }, comprobante: referencia("CAP", pago.pago) };
}
