"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { estados, type Mensaje } from "@/lib/dominio";
import { estadoCaso } from "@/lib/postventa";
import { fechaCorta, fechaHora, usd } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje } from "@/lib/viaje";
import { Etiqueta, ListaPasajeros, tonoCaso, tonoReserva } from "./flujo";
import { agenteActual, MarcoSoporte } from "./soporte";

export function SoporteChats({ inicial }: { inicial?: string }) {
  const { datos } = useDatos();
  const [elegida, setElegida] = useState(inicial);
  const [texto, setTexto] = useState("");
  const agente = agenteActual(datos);
  const conversaciones = Object.entries(datos.chats)
    .filter(([id, mensajes]) => datos.reservas[id] && mensajes.length)
    .map(([id, mensajes]) => ({ id, mensajes, ultimo: mensajes.at(-1)! }))
    .sort((a, b) => b.ultimo.fecha.localeCompare(a.ultimo.fecha));
  const actual = conversaciones.find(item => item.id === elegida) ?? conversaciones[0];
  const reserva = actual && datos.reservas[actual.id];
  const viaje = reserva && detalleViaje(reserva);
  const casos = actual ? Object.values(datos.casos).filter(caso => caso.reserva === actual.id).reverse() : [];

  function enviar(event: FormEvent) {
    event.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !actual || !agente) return;
    const mensaje: Mensaje = { id: crypto.randomUUID(), autor: agente.nombre, texto: limpio, fecha: new Date().toISOString() };
    if (actualizar(d => ({ ...d, chats: { ...d.chats, [actual.id]: [...(d.chats[actual.id] ?? []), mensaje] } }), datos.generacion)) setTexto("");
  }

  return <MarcoSoporte activo="chats" titulo="Chats" bajada="Conversaciones con viajeros, con el contexto de la reserva y del caso.">
    {!actual || !reserva || !viaje ? <section className="panel"><h2>Sin conversaciones.</h2><p className="mt-2">Los chats iniciados por los viajeros durante la compra o el viaje aparecen acá.</p></section>
      : <div className="consola-chat">
        <nav aria-label="Conversaciones"><ul className="chat-lista">
          {conversaciones.map(item => <li key={item.id}><button type="button" aria-current={item.id === actual.id ? "true" : undefined} onClick={() => setElegida(item.id)}>
            <strong>{datos.reservas[item.id].pasajeros?.[0]?.nombre ?? "Viajero"} · {detalleViaje(datos.reservas[item.id]).destino.nombre}</strong>
            <span className="nota">{item.ultimo.texto}</span><span className="micro">{item.id}</span>
          </button></li>)}
        </ul></nav>
        <section className="panel" aria-labelledby="titulo-conversacion">
          <p className="micro acento">CONVERSACIÓN / {actual.id}</p><h2 id="titulo-conversacion">Chat con el viajero</h2>
          <div className="chat-mensajes" role="log" aria-label="Conversación">
            {actual.mensajes.map(item => <article key={item.id} className={item.autor === "Vos" ? "" : "chat-propio"}>
              <p className="micro">{item.autor === "Vos" ? "Viajero" : item.autor} · <time dateTime={item.fecha}>{fechaHora(item.fecha)}</time></p><p>{item.texto}</p>
            </article>)}
          </div>
          <form className="formulario" onSubmit={enviar}>
            <label>Responder como {agente?.nombre}<input value={texto} maxLength={400} required onChange={e => setTexto(e.target.value)}/></label>
            <button type="submit" className="boton primario" disabled={!texto.trim()}>Enviar mensaje</button>
          </form>
        </section>
        <aside className="pila" aria-label="Contexto de la reserva">
          <section className="panel"><p className="micro acento">CONTEXTO DE LA RESERVA</p><h2>{viaje.destino.nombre}</h2>
            <dl className="desglose">
              <div><dt>Localizador</dt><dd><Link href={"/soporte/reservas/" + reserva.id} className="enlace">{reserva.id}</Link></dd></div>
              <div><dt>Viaje</dt><dd>{fechaCorta(viaje.busqueda.ida)} al {fechaCorta(viaje.busqueda.vuelta)}</dd></div>
              <div><dt>Hotel</dt><dd>{viaje.hotel.nombre}</dd></div>
              <div><dt>Vuelo</dt><dd>{viaje.vuelo.codigo}</dd></div>
              <div><dt>Total</dt><dd>{usd(viaje.precios.total)}</dd></div>
              <div><dt>Estado</dt><dd><Etiqueta tono={tonoReserva(reserva.estado)}>{estados[reserva.estado]}</Etiqueta></dd></div>
            </dl>
            <ListaPasajeros reserva={reserva}/>
          </section>
          <section className="panel"><p className="micro acento">CASOS DE ESTA RESERVA</p><h2>Casos</h2>
            {casos.length ? <ul className="lista-alertas">{casos.map(caso => <li key={caso.id}>
              <Link href={"/soporte/casos/" + caso.id} className="enlace">{caso.id} ↗</Link> <Etiqueta tono={tonoCaso(estadoCaso(caso))}>{estadoCaso(caso)}</Etiqueta><p>{caso.etapa}</p>
            </li>)}</ul> : <p className="nota mt-2">Sin casos vinculados.</p>}
          </section>
        </aside>
      </div>}
  </MarcoSoporte>;
}
