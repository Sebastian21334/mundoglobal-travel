"use client";
import type { Caso, Confirmacion, Datos, Escenario, Oferta, OperacionPago, Pago, Pasajero, Reserva } from "./dominio";
import { solicitar } from "./http";
import { crearAviso } from "./postventa";
import { registrar, transicionar } from "./reserva";
import { actualizar, guardarReserva, leer } from "./storage";

const ahora = () => new Date().toISOString();

const operacion = (nombre: string, referencia: string, resultado: string, importe: number, detalle?: string): OperacionPago =>
  ({ fecha: ahora(), operacion: nombre, referencia, resultado, importe, detalle });
const anotar = (reserva: Reserva, ...operaciones: OperacionPago[]): Reserva =>
  ({ ...reserva, operaciones: [...(reserva.operaciones ?? []), ...operaciones] });

export function guardarValidacion(reserva: Reserva, oferta: Oferta, detalle: string, generacion: string) {
  const actual = transicionar({ ...reserva, oferta, validacionMs: Date.now() }, "validada", detalle, ahora());
  return actualizar(datos => ({
    ...datos, reservas: { ...datos.reservas, [actual.id]: actual },
    borrador: datos.borrador?.id === actual.id ? { ...datos.borrador, cambio: undefined } : datos.borrador,
  }), generacion);
}

function abrirRevision(reserva: Reserva, etapa: string, proveedor: string, detalle: string, liberados: string[], generacion: string) {
  const fecha = ahora();
  const fallida = transicionar({ ...reserva, falla: { etapa, proveedor, liberados } }, "en_revision", detalle, fecha);
  const clave = reserva.intento!.clave.replaceAll("-", "").slice(-10).toUpperCase();
  const caso: Caso = { id: "INC-" + clave, reserva: reserva.id, etapa, proveedor, detalle, creado: fecha, automatico: true };
  actualizar(datos => ({
    ...datos, reservas: { ...datos.reservas, [reserva.id]: fallida },
    casos: { ...datos.casos, [caso.id]: caso },
    avisos: [crearAviso(reserva.id, "Incidencia", "Tu reserva quedó en revisión", detalle, fecha, "/reserva/" + reserva.id), ...datos.avisos],
  }), generacion);
}

async function procesar(id: string, escenario: Escenario, reintento: boolean) {
  const datosIniciales = leer();
  const { generacion } = datosIniciales;
  let reserva = datosIniciales.reservas[id];
  if (!reserva || (reserva.estado !== "validada" && reserva.estado !== "pago_autorizado")) return;
  const intento = reserva.intento ?? { clave: crypto.randomUUID(), escenario, reintento };
  if (!reserva.intento) {
    // Persistir antes de llamar a la pasarela mantiene la misma clave tras recargar.
    reserva = registrar({ ...reserva, intento }, "Se inició el intento " + intento.clave.slice(0, 8) + ".", ahora());
    const guardado = actualizar(datos => ({
      ...datos, escenario: "normal", reservas: { ...datos.reservas, [id]: reserva },
    }), generacion);
    if (!guardado) return;
  }
  const importe = reserva.oferta.cotizacion.precios.total;
  let recibo = intento.recibo;
  if (reserva.estado === "validada") {
    const pedido = { token: reserva.oferta.token, ...intento };
    const pago = await solicitar<Pago>("pago", pedido);
    if (!pago.aprobado) {
      abrirRevision(anotar(reserva, operacion("Autorización", "Sin referencia", "Rechazada", importe, pago.detalle)),
        "Autorización", pago.proveedor, pago.detalle, [], generacion);
      return;
    }
    recibo = pago.recibo;
    const operaciones = [operacion("Autorización", pago.autorizacion, "Aprobada", importe, "Clave de idempotencia " + intento.clave.slice(0, 8) + ".")];
    if (intento.escenario === "duplicado") {
      const repetido = await solicitar<Pago>("pago", pedido);
      if (repetido.aprobado && repetido.autorizacion === pago.autorizacion) {
        operaciones.push(operacion("Reenvío detectado", pago.autorizacion, "Sin nuevo cobro", 0, "La misma clave devolvió la autorización original."));
      }
    }
    reserva = transicionar(anotar({ ...reserva, intento: { ...intento, recibo } }, ...operaciones), "pago_autorizado",
      "Autorización " + pago.autorizacion + ". El importe todavía no se capturó.", ahora());
    if (!guardarReserva(reserva, generacion)) return;
  }
  const resultado = await solicitar<Confirmacion>("reservar", { id, recibo });
  if (!resultado.emitida) {
    abrirRevision(anotar(reserva, operacion("Liberación", resultado.liberados[0], "Liberada", importe)), resultado.etapa, resultado.proveedor,
      resultado.detalle + " Referencias liberadas: " + resultado.liberados.join(", ") + ".", resultado.liberados, generacion);
    return;
  }
  const inicio = Date.parse(reserva.historial.at(-1)!.fecha);
  const confirmada = transicionar(reserva, "confirmada", "Vuelo, hotel y asistencia confirmados.", ahora());
  const emitida = transicionar(anotar({
    ...confirmada, referencias: resultado.referencias, comprobante: resultado.comprobante,
    emisionMs: Date.now() - inicio,
  }, operacion("Captura", resultado.comprobante, "Cobrada", importe)), "emitida", "Pago capturado. Voucher de vuelo, hotel, póliza y comprobante emitidos.", ahora());
  actualizar(datos => ({
    ...datos, reservas: { ...datos.reservas, [id]: emitida },
    casos: Object.fromEntries(Object.entries(datos.casos).map(([clave, caso]) => [
      clave, caso.reserva === id && caso.automatico && !caso.cerrado
        ? { ...caso, cerrado: ahora(), resolucion: "Reserva emitida después del reintento." } : caso,
    ])),
    avisos: [crearAviso(id, "Confirmación", "Tu viaje está confirmado", "Vuelo, hotel y asistencia confirmados. Ya podés descargar tus documentos."), ...datos.avisos],
  }), generacion);
}

export async function procesarPago(id: string, escenario: Escenario, reintento = false) {
  if (navigator.locks) {
    await navigator.locks.request("mundoglobal:pago:" + id, () => procesar(id, escenario, reintento));
  } else {
    await procesar(id, escenario, reintento);
  }
}

export async function prepararReintento(reserva: Reserva, generacion: string) {
  const vigente = reserva.oferta.cotizacion.vence > Date.now();
  const cotizacion = reserva.oferta.cotizacion;
  const oferta = vigente ? reserva.oferta : await solicitar<Oferta>("cotizar", {
    busqueda: cotizacion.busqueda, seleccion: cotizacion.seleccion, anterior: reserva.oferta.token, renovar: true,
  });
  const validacion = await solicitar<{ tipo: "lista"; oferta: Oferta }>("validar", { token: oferta.token, escenario: "normal" });
  return guardarValidacion({ ...reserva, intento: undefined, falla: undefined }, validacion.oferta, "Se revalidaron los servicios para un nuevo intento.", generacion);
}

export function guardarPasajero(email: string, pasajero: Pasajero, generacion: string) {
  return actualizar(datos => {
    const cuenta = datos.cuentas[email];
    const existe = cuenta.pasajeros.some(item => item.id === pasajero.id);
    const pasajeros = existe ? cuenta.pasajeros.map(item => item.id === pasajero.id ? pasajero : item) : [...cuenta.pasajeros, pasajero];
    return { ...datos, cuentas: { ...datos.cuentas, [email]: { ...cuenta, pasajeros } } };
  }, generacion);
}

export function quitarPasajero(email: string, id: string, generacion: string) {
  return actualizar(datos => {
    const cuenta = datos.cuentas[email];
    return { ...datos, cuentas: { ...datos.cuentas, [email]: { ...cuenta, pasajeros: cuenta.pasajeros.filter(item => item.id !== id) } } };
  }, generacion);
}

export type DatosDemo = Pick<Datos, "reservas" | "casos" | "chats" | "avisos" | "cuentas" | "sesion" | "borrador">;

export async function cargarDatosDemo() {
  const { generacion } = leer();
  const demo = await solicitar<DatosDemo>("demo", {});
  return actualizar(datos => ({
    ...datos, sesion: demo.sesion, borrador: demo.borrador,
    reservas: { ...datos.reservas, ...demo.reservas }, casos: { ...datos.casos, ...demo.casos },
    chats: { ...datos.chats, ...demo.chats }, cuentas: { ...datos.cuentas, ...demo.cuentas },
    avisos: [...demo.avisos, ...datos.avisos.filter(aviso => !demo.reservas[aviso.reserva])],
  }), generacion);
}
