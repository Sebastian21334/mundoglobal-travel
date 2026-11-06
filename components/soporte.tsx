"use client";
import Link from "next/link";
import { useState } from "react";
import type { Caso } from "@/lib/dominio";
import { fechaHora } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";

function duracion(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? s + " s" : Math.floor(s / 60) + " min " + s % 60 + " s";
}

export function Soporte() {
  const { datos, listo } = useDatos();
  const [filtro, setFiltro] = useState("abiertos");
  const [aviso, setAviso] = useState("");
  const reservas = Object.values(datos.reservas);
  const casos = Object.values(datos.casos).reverse();
  const abiertas = casos.filter(caso => !caso.cerrado);
  const elegibles = reservas.filter(reserva => reserva.historial.some(evento => evento.estado === "pago_autorizado"));
  const emitidas = elegibles.filter(reserva => reserva.emisionMs !== undefined);
  const enPlazo = emitidas.filter(reserva => reserva.emisionMs! <= 300_000).length;
  const porcentaje = elegibles.length ? Math.round(100 * enPlazo / elegibles.length) : null;
  const pendientes = elegibles.length - emitidas.length;
  const cambiosCerrados = casos.filter(caso => !caso.automatico && caso.etapa === "Solicitud de cambio" && caso.cerrado);
  const mediaCambios = cambiosCerrados.length ? duracion(cambiosCerrados.reduce((suma, caso) =>
    suma + Date.parse(caso.cerrado!) - Date.parse(caso.creado), 0) / cambiosCerrados.length) : "Sin cambios cerrados";
  const media = reservas.length ? duracion(reservas.reduce((suma, reserva) => suma + reserva.cotizacionMs, 0) / reservas.length) : "Sin cotizaciones";
  const revision = reservas.filter(reserva => reserva.estado === "en_revision");
  const filtrados = filtro === "todos" ? casos : casos.filter(caso => filtro === "abiertos" ? !caso.cerrado : Boolean(caso.cerrado));

  function cerrar(caso: Caso) {
    const fecha = new Date().toISOString();
    if (!actualizar(d => ({ ...d, casos: { ...d.casos, [caso.id]: { ...caso, cerrado: fecha, resolucion: "Revisión finalizada por Soporte Digital." } } }), datos.generacion)) return;
    setAviso("Caso " + caso.id + " cerrado.");
  }

  return <main id="contenido" className="marco interior">
    <p className="micro acento">OPERACIONES / VISTA DE DEMOSTRACIÓN</p><h1>Soporte digital</h1>
    <p className="bajada">Seguimiento de reservas y solicitudes guardadas en este navegador.</p>
    {!listo ? <p role="status">Cargando indicadores…</p> : <>
      <dl className="indicadores">
        <div><dt>Tiempo medio de cotización</dt><dd>{media}</dd><p>Objetivo ≤ 10 min · {reservas.length} cotizaciones</p></div>
        <div><dt>Emisiones en ≤ 5 min</dt><dd>{porcentaje === null ? "Sin autorizaciones" : porcentaje + " %"}</dd><p>Objetivo ≥ 90 % · {enPlazo} de {elegibles.length} reservas autorizadas</p><p>{pendientes} autorizadas pendientes de emisión</p></div>
        <div><dt>Casos abiertos</dt><dd>{abiertas.length}</dd><p>{casos.length - abiertas.length} cerrados</p></div>
      </dl>
      <section className="panel mt-6"><p className="micro acento">OPERACIONES PENDIENTES</p><h2>Reservas en revisión</h2>
        <p className="nota mt-2">Tiempo medio de cambios cerrados: <strong>{mediaCambios}</strong>. Objetivo ≤ 20 min.</p>
        {revision.length ? <ul className="lista-alertas">{revision.map(reserva => <li key={reserva.id}>
          <Link href={"/reserva/" + reserva.id} className="enlace">{reserva.id} ↗</Link><p>{reserva.historial.at(-1)?.detalle}</p>
        </li>)}</ul> : <p className="nota mt-2">No hay reservas en revisión.</p>}
      </section>
      <section className="panel mt-6"><div className="titulo-fila"><div><p className="micro acento">TRAZABILIDAD</p><h2>Registro de incidencias</h2></div>
        <label>Mostrar<select value={filtro} onChange={e => setFiltro(e.target.value)}><option value="abiertos">Abiertos</option><option value="cerrados">Cerrados</option><option value="todos">Todos</option></select></label>
      </div>
      <p role="status" className="nota mt-2">{aviso}</p>
      {!filtrados.length ? <p className="nota mt-2">No hay casos para este filtro.</p> : <div className="tabla-scroll" tabIndex={0} role="region" aria-label="Tabla de incidencias">
        <table className="tabla"><thead><tr>{["Caso y reserva","Etapa y proveedor","Incidencia","Tiempo de resolución","Estado"].map(col => <th key={col} scope="col">{col}</th>)}</tr></thead>
          <tbody>{filtrados.map(caso => <tr key={caso.id}><th scope="row">{caso.id}<br/><Link href={"/mis-viajes/" + caso.reserva} className="enlace">{caso.reserva}</Link></th>
            <td>{caso.etapa}<br/><span className="nota">{caso.proveedor}</span></td><td>{caso.detalle}</td>
            <td>{caso.cerrado ? duracion(Date.parse(caso.cerrado) - Date.parse(caso.creado)) : "Pendiente"}<br/><span className="nota">{fechaHora(caso.creado)}</span></td>
            <td>{caso.cerrado ? "Cerrado" : <button type="button" className="boton" onClick={() => cerrar(caso)}>Cerrar caso</button>}</td>
          </tr>)}</tbody></table>
      </div>}
      </section>
    </>}
  </main>;
}
