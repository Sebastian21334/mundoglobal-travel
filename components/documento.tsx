"use client";
import Link from "next/link";
import { useDatos } from "@/lib/storage";
import { bajadaDocumento, camposDocumento, descargarDocumento, detalleViaje, documentos, pieDocumento, type TipoDocumento } from "@/lib/viaje";
import { SinDatos } from "./flujo";

export function Documento({ id, tipo }: { id: string; tipo: TipoDocumento }) {
  const { datos, listo } = useDatos();
  const reserva = datos.reservas[id];
  if (!reserva || reserva.estado !== "emitida") return <SinDatos listo={listo} mensaje="Los documentos aparecen después de que se emite la reserva." />;
  return <main id="contenido" className="marco interior documento">
    <div className="acciones no-print"><Link href={"/mis-viajes/" + id} className="boton">← Volver al viaje</Link>
      <button type="button" className="boton primario" onClick={() => descargarDocumento(reserva, tipo)}>Descargar PDF</button>
      <button type="button" className="boton" onClick={() => window.print()}>Imprimir</button></div>
    <article className="hoja">
      <header><span className="micro">MUNDOGLOBAL TRAVEL / DOCUMENTO DE VIAJE</span><span className="micro">{detalleViaje(reserva).codigo} / {id}</span></header>
      <h1>{documentos[tipo]}</h1><p className="bajada">{bajadaDocumento(reserva)}</p>
      <dl className="lista-servicios">{camposDocumento(reserva, tipo).map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd>{valor}</dd></div>)}</dl>
      <p className="nota mt-6">{pieDocumento}</p>
    </article>
  </main>;
}
