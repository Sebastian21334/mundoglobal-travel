import { catalogo, origenes } from "./datos/catalogos";
import { codigoDestino, destinos } from "./datos/destinos";
import { nombreCompleto } from "./cuenta";
import type { Reserva } from "./dominio";
import { crearPdf } from "./pdf";
import { cantidadViajeros, elegidos, fechaCorta, fechaHora, noches, sumarDias, usd } from "./precios";

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

export type Tono = "ok" | "pendiente" | "alerta";
export type ServicioReservado = { servicio: string; detalle: string; estado: string; tono: Tono; referencia?: string };

export function estadoServicios(reserva: Reserva): ServicioReservado[] {
  const { vuelo, hotel, asistencia } = detalleViaje(reserva);
  const servicios = [
    { clave: "vuelo", prefijo: "VUE-", servicio: "Vuelo", detalle: vuelo.linea + " · " + vuelo.codigo },
    { clave: "hotel", prefijo: "HOT-", servicio: "Hotel All Inclusive", detalle: hotel.nombre },
    { clave: "asistencia", prefijo: "ASI-", servicio: "Asistencia al viajero", detalle: "Plan " + asistencia.nombre },
  ] as const;
  return servicios.map(({ clave, prefijo, servicio, detalle }): ServicioReservado => {
    const base = { servicio, detalle };
    if (reserva.referencias) return { ...base, estado: "Confirmado", tono: "ok", referencia: reserva.referencias[clave] };
    if (reserva.estado === "cancelada") return { ...base, estado: "Cancelado", tono: "alerta" };
    if (reserva.falla) {
      const referencia = reserva.falla.liberados.find(item => item.startsWith(prefijo));
      if (referencia) return { ...base, estado: "Liberado", tono: "alerta", referencia };
      return { ...base, estado: reserva.falla.etapa === "Confirmación" ? "No confirmado" : "Sin solicitar", tono: "alerta" };
    }
    if (reserva.estado === "pago_autorizado" || reserva.estado === "confirmada") return { ...base, estado: "En proceso", tono: "pendiente" };
    return { ...base, estado: "Pendiente de pago", tono: "pendiente" };
  });
}

export function camposDocumento(reserva: Reserva, tipo: TipoDocumento): [string, string][] {
  const { vuelo, hotel, asistencia, busqueda, estadia, origen, precios, destino, codigo } = detalleViaje(reserva);
  const referencias = reserva.referencias!;
  const nombres = reserva.pasajeros?.map(nombreCompleto).join(", ");
  const viajeros: [string, string][] = nombres ? [["Pasajeros", nombres]] : [];
  const campos: Record<TipoDocumento, [string, string][]> = {
    vuelo: [["Referencia", referencias.vuelo], ...viajeros, ["Operador", vuelo.linea + " · " + vuelo.codigo],
      ["Ida", fechaCorta(busqueda.ida) + " · " + origen + " " + vuelo.salida + " → " + destino.aeropuerto + " (" + codigo + ") " + vuelo.llegada],
      ["Vuelta", fechaCorta(busqueda.vuelta) + " · " + destino.aeropuerto + " (" + codigo + ") " + (vuelo.regreso ?? "15:35") + " → " + origen],
      ["Itinerario", vuelo.escala + ". Horarios locales."], ["Equipaje por viajero", vuelo.equipaje]],
    hotel: [["Referencia", referencias.hotel], ...viajeros, ["Hotel", hotel.nombre + " · " + hotel.zona],
      ["Estadía", estadia + " noches, base doble"], ["Ingreso", fechaCorta(busqueda.ida) + " desde las 15:00"],
      ["Salida", fechaCorta(busqueda.vuelta) + " hasta las 11:00"], ["Incluye", hotel.incluye], ["Política", hotel.politica]],
    asistencia: [["Referencia", referencias.asistencia], ...viajeros, ["Plan", asistencia.nombre],
      ["Vigencia", fechaCorta(busqueda.ida) + " a " + fechaCorta(busqueda.vuelta)], ["Tope médico por viajero", usd(asistencia.cobertura * 100)],
      ["Cobertura", asistencia.incluye], ["Contacto de muestra", "Chat de asistencia en Mis viajes"]],
    pago: [["Referencia de captura", reserva.comprobante!], ["Estado", "Capturado en pasarela simulada"],
      ["Fecha de emisión", fechaHora(reserva.historial.at(-1)!.fecha)],
      ["Vuelo", usd(precios.vuelo)], ["Hotel", usd(precios.hotel)], ["Asistencia", usd(precios.asistencia)], ["Total", usd(precios.total)]],
  };
  return campos[tipo];
}

export const bajadaDocumento = (reserva: Reserva) => {
  const { busqueda, destino } = detalleViaje(reserva);
  return cantidadViajeros(busqueda.pasajeros) + " · " + destino.nombre + (destino.nombre !== destino.pais ? ", " + destino.pais : "");
};

export const pieDocumento = "Documento de muestra para el Trabajo Práctico Integrador 2026. UTN FRVM, Grupo R.";

export function descargarDocumento(reserva: Reserva, tipo: TipoDocumento) {
  const bytes = crearPdf({
    marca: "MUNDOGLOBAL TRAVEL / DOCUMENTO DE VIAJE", referencia: detalleViaje(reserva).codigo + " / " + reserva.id,
    titulo: documentos[tipo], bajada: bajadaDocumento(reserva), filas: camposDocumento(reserva, tipo), pie: pieDocumento,
  });
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = tipo + "-" + reserva.id + ".pdf";
  enlace.click();
  URL.revokeObjectURL(url);
}
