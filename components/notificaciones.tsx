"use client";
import Link from "next/link";
import { useState } from "react";
import type { Aviso, TipoAviso } from "@/lib/dominio";
import { fechaHora } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje, type Tono } from "@/lib/viaje";
import { Etiqueta } from "./flujo";

const tipos: TipoAviso[] = ["Confirmación", "Variación", "Incidencia", "Caso"];
const tonos: Record<TipoAviso, Tono> = { Confirmación: "ok", Variación: "pendiente", Incidencia: "alerta", Caso: "pendiente" };

export function Notificaciones() {
  const { datos, listo } = useDatos();
  const [filtro, setFiltro] = useState<TipoAviso | "Todas">("Todas");
  const visibles = datos.avisos.filter(aviso => filtro === "Todas" || aviso.tipo === filtro);
  const sinLeer = datos.avisos.filter(aviso => !aviso.leido).length;

  const marcar = (condicion: (aviso: Aviso) => boolean) =>
    actualizar(d => ({ ...d, avisos: d.avisos.map(aviso => condicion(aviso) ? { ...aviso, leido: true } : aviso) }), datos.generacion);

  return <main id="contenido" className="marco interior">
    <div className="titulo-fila"><div><p className="micro acento">CENTRO DE AVISOS / {sinLeer} SIN LEER</p><h1>Notificaciones</h1></div>
      {sinLeer > 0 && <button type="button" className="boton" onClick={() => marcar(() => true)}>Marcar todas como leídas</button>}</div>
    <p className="bajada">Confirmaciones, variaciones e incidencias de tus viajes, cada una vinculada con su reserva.</p>
    <nav className="subnav" aria-label="Filtrar notificaciones">
      {(["Todas", ...tipos] as const).map(tipo => <button key={tipo} type="button" aria-current={filtro === tipo ? "page" : undefined} onClick={() => setFiltro(tipo)}>{tipo}</button>)}
    </nav>
    {!listo ? <p role="status">Cargando avisos…</p> : !visibles.length ? <section className="panel"><h2>Sin avisos por ahora.</h2><p className="mt-2">Vas a ver acá las novedades de tus reservas.</p></section>
      : <ul className="registros lista-avisos" aria-label="Notificaciones">
        {visibles.map(aviso => {
          const reserva = datos.reservas[aviso.reserva];
          return <li key={aviso.id} className={aviso.leido ? undefined : "aviso-nuevo"}>
            <div>
              <p className="micro acento">{fechaHora(aviso.fecha)}{aviso.leido ? "" : " / SIN LEER"}</p>
              <h3>{aviso.titulo}</h3><p>{aviso.detalle}</p>
              <p className="nota mt-1">Reserva <Link href={"/mis-viajes/" + aviso.reserva} className="enlace">{aviso.reserva}{reserva ? " · " + detalleViaje(reserva).destino.nombre : ""}</Link></p>
            </div>
            <div className="fila-acciones"><Etiqueta tono={tonos[aviso.tipo]}>{aviso.tipo}</Etiqueta>
              <Link href={aviso.enlace ?? "/mis-viajes/" + aviso.reserva} className="boton" onClick={() => marcar(item => item.id === aviso.id)}>Ver detalle <span aria-hidden="true">↗</span></Link></div>
          </li>;
        })}
      </ul>}
  </main>;
}
