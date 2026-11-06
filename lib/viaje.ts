import { catalogo, origenes } from "./datos/catalogos";
import type { Reserva } from "./dominio";
import { elegidos, noches, sumarDias } from "./precios";

export const documentos = {
  vuelo: "Voucher de vuelo", hotel: "Voucher de hotel",
  asistencia: "Póliza de asistencia", pago: "Comprobante de pago",
};
export type TipoDocumento = keyof typeof documentos;

export function detalleViaje(reserva: Reserva) {
  const { busqueda, seleccion, precios } = reserva.oferta.cotizacion;
  return {
    ...elegidos(catalogo(busqueda.origen, busqueda.ida), seleccion),
    busqueda, precios, estadia: noches(busqueda), origen: origenes[busqueda.origen],
  };
}

export function itinerario(reserva: Reserva) {
  const { vuelo, hotel, busqueda, estadia, origen } = detalleViaje(reserva);
  return Array.from({ length: estadia + 1 }, (_, dia) => ({
    fecha: sumarDias(busqueda.ida, dia),
    titulo: dia === 0 ? origen + " → Punta Cana" : dia === estadia ? "Punta Cana → " + origen : "Estadía en " + hotel.zona,
    detalle: dia === 0 ? vuelo.codigo + " · Salida " + vuelo.salida + " · Llegada " + vuelo.llegada + ". Ingreso a " + hotel.nombre + " desde las 15:00."
      : dia === estadia ? "Dejá la habitación antes de las 11:00. El horario de regreso figura en el voucher de vuelo."
      : "Día libre. " + hotel.incluye,
  }));
}

export const horaRegreso = "15:35";
