import type { Estado, Reserva } from "./dominio";

const transiciones: Record<Estado, readonly Estado[]> = {
  cotizada: ["validada", "cancelada"],
  validada: ["pago_autorizado", "en_revision", "cancelada"],
  pago_autorizado: ["confirmada", "en_revision"],
  confirmada: ["emitida", "en_revision"],
  emitida: [],
  en_revision: ["validada", "cancelada"],
  cancelada: [],
};

export function registrar(reserva: Reserva, detalle: string, fecha: string): Reserva {
  return { ...reserva, historial: [...reserva.historial, { estado: reserva.estado, fecha, detalle }] };
}

export function transicionar(reserva: Reserva, estado: Estado, detalle: string, fecha: string): Reserva {
  if (!transiciones[reserva.estado].includes(estado)) {
    throw new Error("Transición inválida: " + reserva.estado + " → " + estado);
  }
  return registrar({ ...reserva, estado }, detalle, fecha);
}
