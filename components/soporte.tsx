"use client";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { agentes } from "@/lib/agentes";
import { estados, type Datos } from "@/lib/dominio";
import { estadoCaso } from "@/lib/postventa";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje } from "@/lib/viaje";
import { Etiqueta, tonoCaso, tonoReserva } from "./flujo";

export const agenteActual = (datos: Pick<Datos, "agente">) => agentes.find(agente => agente.email === datos.agente);

export function duracion(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? s + " s" : Math.floor(s / 60) + " min " + s % 60 + " s";
}

function AccesoSoporte() {
  const { datos } = useDatos();
  const [email, setEmail] = useState(agentes[0].email);
  const [clave, setClave] = useState("demostracion");
  const [error, setError] = useState("");

  function enviar(event: FormEvent) {
    event.preventDefault();
    const correo = email.trim().toLowerCase();
    if (!agentes.some(agente => agente.email === correo)) { setError("Ese correo no pertenece al personal autorizado de Soporte Digital."); return; }
    actualizar(d => ({ ...d, agente: correo }), datos.generacion);
  }

  return <main id="contenido" className="marco interior">
    <p className="micro acento">OPERACIONES / PERSONAL AUTORIZADO</p><h1>Soporte digital</h1>
    <p className="bajada">El panel de gestión está disponible solo para el personal autorizado de MundoGlobal Travel.</p>
    <section className="panel acceso-aviso"><p className="micro acento">ACCESO RESTRINGIDO</p><h2>Ingresá con tu usuario</h2>
      <form className="formulario" onSubmit={enviar}>
        <label>Correo corporativo<input type="email" required value={email} onChange={e => { setEmail(e.target.value); setError(""); }}/></label>
        <label>Contraseña<input type="password" required value={clave} onChange={e => setClave(e.target.value)}/></label>
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" className="boton primario">Ingresar al panel</button>
      </form>
      <p className="nota mt-3">Acceso simulado para la demostración. Solo se aceptan los correos de los agentes de muestra y la contraseña no se valida ni se guarda.</p>
    </section>
  </main>;
}

const secciones = [
  { clave: "panel", href: "/soporte", nombre: "Panel" }, { clave: "reservas", href: "/soporte/reservas", nombre: "Reservas" },
  { clave: "casos", href: "/soporte/casos", nombre: "Casos" }, { clave: "chats", href: "/soporte/chats", nombre: "Chats" },
];

export function MarcoSoporte({ activo, titulo, bajada, children }: { activo: string; titulo: string; bajada?: string; children: ReactNode }) {
  const { datos, listo } = useDatos();
  if (!listo) return <main id="contenido" className="marco interior"><p role="status">Cargando el panel…</p></main>;
  const agente = agenteActual(datos);
  if (!agente) return <AccesoSoporte/>;
  return <main id="contenido" className="marco interior">
    <div className="titulo-fila"><div><p className="micro acento">OPERACIONES / PERSONAL AUTORIZADO</p><h1>{titulo}</h1></div>
      <p className="soporte-sesion"><strong>{agente.nombre}</strong><br/>{agente.rol}<br/><button type="button" className="enlace" onClick={() => actualizar(d => ({ ...d, agente: undefined }), datos.generacion)}>Cerrar sesión</button></p></div>
    {bajada && <p className="bajada">{bajada}</p>}
    <nav className="subnav" aria-label="Panel de Soporte Digital">
      {secciones.map(item => <Link key={item.clave} href={item.href} aria-current={activo === item.clave ? "page" : undefined}>{item.nombre}</Link>)}
    </nav>
    {children}
  </main>;
}

export function Soporte() {
  const { datos } = useDatos();
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
  const operaciones = reservas.filter(reserva => reserva.estado === "en_revision" || reserva.estado === "pago_autorizado" || reserva.estado === "confirmada");

  return <MarcoSoporte activo="panel" titulo="Soporte digital" bajada="Indicadores, operaciones pendientes y casos por atender.">
    <dl className="indicadores">
      <div><dt>Tiempo medio de cotización</dt><dd>{media}</dd><p>Objetivo ≤ 10 min · {reservas.length} cotizaciones</p></div>
      <div><dt>Emisiones en ≤ 5 min</dt><dd>{porcentaje === null ? "Sin autorizaciones" : porcentaje + " %"}</dd><p>Objetivo ≥ 90 % · {enPlazo} de {elegibles.length} reservas autorizadas</p><p>{pendientes} autorizadas pendientes de emisión</p></div>
      <div><dt>Casos abiertos</dt><dd>{abiertas.length}</dd><p>{casos.length - abiertas.length} cerrados</p></div>
    </dl>
    <section className="panel mt-6"><p className="micro acento">OPERACIONES PENDIENTES</p><h2>Reservas por revisar</h2>
      <p className="nota mt-2">Tiempo medio de cambios cerrados: <strong>{mediaCambios}</strong>. Objetivo ≤ 20 min.</p>
      {operaciones.length ? <ul className="lista-alertas">{operaciones.map(reserva => <li key={reserva.id} className="registro-operacion">
        <div><p className="micro acento">{detalleViaje(reserva).destino.nombre}</p><strong>{reserva.id}</strong><p>{reserva.historial.at(-1)?.detalle}</p></div>
        <div className="fila-acciones"><Etiqueta tono={tonoReserva(reserva.estado)}>{estados[reserva.estado]}</Etiqueta><Link href={"/soporte/reservas/" + reserva.id} className="enlace">Abrir ficha ↗</Link></div>
      </li>)}</ul> : <p className="nota mt-2">No hay operaciones pendientes.</p>}
    </section>
    <section className="panel mt-6"><p className="micro acento">INCIDENCIAS</p><h2>Casos por atender</h2>
      {abiertas.length ? <ul className="lista-alertas">{abiertas.slice(0, 5).map(caso => <li key={caso.id} className="registro-operacion">
        <div><p className="micro acento">{caso.id} / {caso.reserva}</p><strong>{caso.etapa}</strong><p>{caso.detalle}</p><p className="nota">{caso.asignado ? "Asignado a " + caso.asignado : "Sin asignar"}</p></div>
        <div className="fila-acciones"><Etiqueta tono={tonoCaso(estadoCaso(caso))}>{estadoCaso(caso)}</Etiqueta><Link href={"/soporte/casos/" + caso.id} className="boton">Atender</Link></div>
      </li>)}</ul> : <p className="nota mt-2">No hay casos abiertos.</p>}
    </section>
  </MarcoSoporte>;
}
