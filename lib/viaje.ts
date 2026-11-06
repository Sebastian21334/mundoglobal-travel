import { catalogo, origenes } from "./datos/catalogos";
import { codigoDestino, destinos } from "./datos/destinos";
import type { Reserva } from "./dominio";
import { elegidos, noches, sumarDias } from "./precios";

export const documentos = {
  vuelo: "Voucher de vuelo", hotel: "Voucher de hotel",
  asistencia: "Póliza de asistencia", pago: "Comprobante de pago",
};
export type TipoDocumento = keyof typeof documentos;

export function detalleViaje(reserva: Reserva) {
  const { busqueda, seleccion, precios } = reserva.oferta.cotizacion;
  const codigo = codigoDestino(busqueda);
  return {
    ...elegidos(catalogo(busqueda), seleccion),
    busqueda, precios, estadia: noches(busqueda), origen: origenes[busqueda.origen], destino: destinos[codigo], codigo,
  };
}

export function itinerario(reserva: Reserva) {
  const { vuelo, hotel, busqueda, estadia, origen, destino } = detalleViaje(reserva);
  return Array.from({ length: estadia + 1 }, (_, dia) => ({
    fecha: sumarDias(busqueda.ida, dia),
    titulo: dia === 0 ? origen + " → " + destino.aeropuerto : dia === estadia ? destino.aeropuerto + " → " + origen : "Estadía en " + hotel.zona,
    detalle: dia === 0 ? vuelo.codigo + " · Salida " + vuelo.salida + " · Llegada " + vuelo.llegada + ". " + hotel.nombre + " reserva la habitación desde las 15:00 de la fecha de ingreso."
      : dia === estadia ? "Dejá la habitación antes de las 11:00. El vuelo sale a las " + (vuelo.regreso ?? "15:35") + "."
      : "Día libre. " + hotel.incluye,
  }));
}
