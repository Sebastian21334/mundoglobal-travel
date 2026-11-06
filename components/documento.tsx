"use client";
import Link from "next/link";
import { fechaCorta, fechaHora, usd } from "@/lib/precios";
import { useDatos } from "@/lib/storage";
import { detalleViaje, documentos, horaRegreso, type TipoDocumento } from "@/lib/viaje";
import { SinDatos } from "./flujo";

export function Documento({ id, tipo }: { id: string; tipo: TipoDocumento }) {
  const { datos, listo } = useDatos();
  const reserva = datos.reservas[id];
  if (!reserva || reserva.estado !== "emitida") return <SinDatos listo={listo} mensaje="Los documentos aparecen después de que se emite la reserva." />;
  const { vuelo, hotel, asistencia, busqueda, estadia, origen, precios } = detalleViaje(reserva);
  const referencias = reserva.referencias!;
  const campos: Record<TipoDocumento, [string, string][]> = {
    vuelo: [["Referencia", referencias.vuelo], ["Operador", vuelo.linea + " · " + vuelo.codigo],
      ["Ida", fechaCorta(busqueda.ida) + " · " + origen + " " + vuelo.salida + " → Punta Cana " + vuelo.llegada],
      ["Vuelta", fechaCorta(busqueda.vuelta) + " · Punta Cana " + horaRegreso + " → " + origen],
      ["Itinerario", vuelo.escala + ". Horarios locales."], ["Equipaje por viajero", vuelo.equipaje]],
    hotel: [["Referencia", referencias.hotel], ["Hotel", hotel.nombre + " · " + hotel.zona],
      ["Estadía", estadia + " noches, base doble"], ["Ingreso", fechaCorta(busqueda.ida) + " desde las 15:00"],
      ["Salida", fechaCorta(busqueda.vuelta) + " hasta las 11:00"], ["Incluye", hotel.incluye], ["Política", hotel.politica]],
    asistencia: [["Referencia", referencias.asistencia], ["Plan", asistencia.nombre],
      ["Vigencia", fechaCorta(busqueda.ida) + " a " + fechaCorta(busqueda.vuelta)], ["Tope médico por viajero", usd(asistencia.cobertura * 100)],
      ["Cobertura", asistencia.incluye], ["Contacto de muestra", "Chat de asistencia en Mis viajes"]],
    pago: [["Referencia de captura", reserva.comprobante!], ["Estado", "Capturado en pasarela simulada"],
      ["Fecha de emisión", fechaHora(reserva.historial.at(-1)!.fecha)],
      ["Vuelo", usd(precios.vuelo)], ["Hotel", usd(precios.hotel)], ["Asistencia", usd(precios.asistencia)], ["Total", usd(precios.total)]],
  };
  return <main id="contenido" className="marco interior documento">
    <div className="acciones no-print"><Link href={"/mis-viajes/" + id} className="boton">← Volver al viaje</Link>
      <button type="button" className="boton primario" onClick={() => window.print()}>Imprimir o guardar PDF</button></div>
    <article className="hoja">
      <header><span className="micro">MUNDOGLOBAL TRAVEL / DOCUMENTO DE VIAJE</span><span className="micro">PUJ / {id}</span></header>
      <h1>{documentos[tipo]}</h1><p className="bajada">{busqueda.pasajeros} viajeros · Punta Cana, República Dominicana</p>
      <dl className="lista-servicios">{campos[tipo].map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd>{valor}</dd></div>)}</dl>
      <p className="nota mt-6">Documento de muestra para el Trabajo Práctico Integrador 2026. UTN FRVM, Grupo R.</p>
    </article>
  </main>;
}
