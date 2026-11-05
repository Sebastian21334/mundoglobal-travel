"use client";
import type { Caso, Confirmacion, Escenario, Oferta, Pago, Reserva } from "./dominio";
import { solicitar } from "./http";
import { registrar, transicionar } from "./reserva";
import { actualizar, guardarReserva, leer } from "./storage";

const ahora = () => new Date().toISOString();

export function guardarValidacion(reserva: Reserva, oferta: Oferta, detalle: string) {
  const actual = transicionar({ ...reserva, oferta, validacionMs: Date.now() }, "validada", detalle, ahora());
  actualizar(datos => ({
    ...datos, reservas: { ...datos.reservas, [actual.id]: actual },
    borrador: datos.borrador?.id === actual.id ? { ...datos.borrador, cambio: undefined } : datos.borrador,
  }));
}

function abrirRevision(reserva: Reserva, etapa: string, proveedor: string, detalle: string) {
  const fecha = ahora();
  const fallida = transicionar(reserva, "en_revision", detalle, fecha);
  const clave = reserva.intento!.clave.replaceAll("-", "").slice(-10).toUpperCase();
  const caso: Caso = { id: "INC-" + clave, reserva: reserva.id, etapa, proveedor, detalle, creado: fecha, automatico: true };
  actualizar(datos => ({
    ...datos, reservas: { ...datos.reservas, [reserva.id]: fallida },
    casos: { ...datos.casos, [caso.id]: caso },
  }));
}

async function procesar(id: string, escenario: Escenario, reintento: boolean) {
  let reserva = leer().reservas[id];
  if (!reserva || (reserva.estado !== "validada" && reserva.estado !== "pago_autorizado")) return;
  const intento = reserva.intento ?? { clave: crypto.randomUUID(), escenario, reintento };
  if (!reserva.intento) {
    // Persistir antes de llamar a la pasarela mantiene la misma clave tras recargar.
    reserva = registrar({ ...reserva, intento }, "Se inició el intento " + intento.clave.slice(0, 8) + ".", ahora());
    actualizar(datos => ({
      ...datos, escenario: "normal", reservas: { ...datos.reservas, [id]: reserva },
    }));
  }
  let recibo = intento.recibo;
  if (reserva.estado === "validada") {
    const pago = await solicitar<Pago>("pago", { token: reserva.oferta.token, ...intento });
    if (!pago.aprobado) {
      abrirRevision(reserva, "Autorización", pago.proveedor, pago.detalle);
      return;
    }
    recibo = pago.recibo;
    reserva = transicionar({ ...reserva, intento: { ...intento, recibo } }, "pago_autorizado",
      "Autorización " + pago.autorizacion + ". El importe todavía no se capturó.", ahora());
    guardarReserva(reserva);
  }
  const resultado = await solicitar<Confirmacion>("reservar", { id, recibo });
  if (!resultado.emitida) {
    abrirRevision(reserva, resultado.etapa, resultado.proveedor,
      resultado.detalle + " Referencias liberadas: " + resultado.liberados.join(", ") + ".");
    return;
  }
  const inicio = Date.parse(reserva.historial.at(-1)!.fecha);
  const confirmada = transicionar(reserva, "confirmada", "Vuelo, hotel y asistencia confirmados.", ahora());
  const emitida = transicionar({
    ...confirmada, referencias: resultado.referencias, comprobante: resultado.comprobante,
    emisionMs: Date.now() - inicio,
  }, "emitida", "Pago capturado. Voucher de vuelo, hotel, póliza y comprobante emitidos.", ahora());
  actualizar(datos => ({
    ...datos, reservas: { ...datos.reservas, [id]: emitida },
    casos: Object.fromEntries(Object.entries(datos.casos).map(([clave, caso]) => [
      clave, caso.reserva === id && caso.automatico && !caso.cerrado
        ? { ...caso, cerrado: ahora(), resolucion: "Reserva emitida después del reintento." } : caso,
    ])),
  }));
}

export async function procesarPago(id: string, escenario: Escenario, reintento = false) {
  if (navigator.locks) {
    await navigator.locks.request("mundoglobal:pago:" + id, () => procesar(id, escenario, reintento));
  } else {
    await procesar(id, escenario, reintento);
  }
}

export async function prepararReintento(reserva: Reserva) {
  const vigente = reserva.oferta.cotizacion.vence > Date.now();
  const cotizacion = reserva.oferta.cotizacion;
  const oferta = vigente ? reserva.oferta : await solicitar<Oferta>("cotizar", {
    busqueda: cotizacion.busqueda, seleccion: cotizacion.seleccion, anterior: reserva.oferta.token, renovar: true,
  });
  const validacion = await solicitar<{ tipo: "lista"; oferta: Oferta }>("validar", { token: oferta.token, escenario: "normal" });
  guardarValidacion({ ...reserva, intento: undefined }, validacion.oferta, "Se revalidaron los servicios para un nuevo intento.");
}
