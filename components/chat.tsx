"use client";
import { useEffect, useState, type FormEvent } from "react";
import { agentes } from "@/lib/agentes";
import type { Mensaje } from "@/lib/dominio";
import { fechaHora } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";

const sinMensajes: Mensaje[] = [];

const respuestas = [
  "Ya ubiqué la reserva. Decime qué servicio querés revisar y en qué fecha necesitás el cambio.",
  "Gracias por el detalle. Si ya abriste una solicitud, pasame el número de caso para seguirla desde acá.",
  "Dejo tu consulta asociada al viaje. Si el proveedor cambia una condición, va a aparecer en el seguimiento.",
];

function responder(texto: string, indice: number) {
  if (/equipaje|valija/i.test(texto)) return "Te confirmo dónde verlo: abrí el voucher de vuelo y buscá la franquicia de equipaje. Si necesitás sumar una valija, abrí una solicitud de cambio para que podamos cotizarla.";
  if (/hotel|habitaci[oó]n/i.test(texto)) return "Revisá en el voucher de hotel el horario de ingreso y la política de cambios. Si necesitás ingresar antes o cambiar la habitación, decime qué fecha te sirve.";
  if (/asistencia|m[eé]dic|seguro/i.test(texto)) return "La póliza muestra el tope médico y el nivel contratado. Contame si la consulta es por cobertura o por un incidente durante el viaje para orientarte.";
  if (/vuelo|demora|cancel/i.test(texto)) return "Voy a revisar el tramo aéreo. Indicame si el cambio afecta la ida o la vuelta. Podés ver los horarios vigentes en el voucher y las alertas del viaje.";
  return respuestas[indice % respuestas.length];
}

export function ChatFlotante({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  return <div className="chat-flotante no-print">
    {abierto && <div id="chat-compra" className="chat-flotante-panel"><Chat id={id} momento="compra"/></div>}
    <button type="button" className="boton exito chat-flotante-boton" aria-expanded={abierto} aria-controls="chat-compra" title="Hablá con Soporte Digital"
      aria-label={abierto ? "Cerrar chat con Soporte Digital" : "Abrir chat con Soporte Digital"} onClick={() => setAbierto(!abierto)}>
      {abierto ? <span aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4z" strokeLinejoin="round"/></svg>}
    </button>
  </div>;
}

export function Chat({ id, momento = "viaje" }: { id: string; momento?: "compra" | "viaje" }) {
  const { datos } = useDatos();
  const [texto, setTexto] = useState("");
  const [hora, setHora] = useState(() => Date.now());
  const mensajes = datos.chats[id] ?? sinMensajes;
  const ultimoDisponible = Math.max(0, ...mensajes.map(mensaje => mensaje.disponible ?? 0));
  useEffect(() => {
    if (ultimoDisponible <= hora) return;
    const siguiente = Math.min(...mensajes.filter(m => (m.disponible ?? 0) > hora).map(m => m.disponible!));
    const timer = window.setTimeout(() => setHora(Date.now()), Math.max(0, siguiente - Date.now()) + 20);
    return () => window.clearTimeout(timer);
  }, [hora, mensajes, ultimoDisponible]);

  const indice = mensajes.filter(m => m.autor === "Vos").length;
  const horaArgentina = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()));
  const agente = agentes[horaArgentina >= 9 && horaArgentina < 17 ? 0 : horaArgentina >= 17 || horaArgentina === 0 ? 1 : 2];

  function enviar(event: FormEvent) {
    event.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    const ahora = Date.now();
    const disponible = Math.max(ahora + 2800 + (indice % 3) * 900, ultimoDisponible + 750);
    const nuevo: Mensaje = { id: crypto.randomUUID(), autor: "Vos", texto: limpio, fecha: new Date(ahora).toISOString() };
    const respuesta: Mensaje = {
      id: crypto.randomUUID(), autor: agente.nombre, texto: responder(limpio, indice),
      fecha: new Date(disponible).toISOString(), disponible,
    };
    if (!actualizar(d => ({ ...d, chats: { ...d.chats, [id]: [...(d.chats[id] ?? []), nuevo, respuesta] } }), datos.generacion)) return;
    setHora(ahora);
    setTexto("");
  }

  return <section className="panel" aria-labelledby="chat">
    <p className="micro acento">{momento === "compra" ? "ATENCIÓN DURANTE LA COMPRA" : "ATENCIÓN DURANTE EL VIAJE"}</p><h2 id="chat">Chat con Soporte Digital</h2>
    <p className="nota">{agente.nombre} · Guardia {agente.turno} · Chat simulado</p>
    <div className="chat-mensajes" role="log" aria-label="Conversación de asistencia" aria-live="polite">
      {!mensajes.length && <p className="nota">Hola, soy {agente.nombre.split(" ")[0]}. Tengo tu reserva {id} a mano. ¿Qué necesitás revisar?</p>}
      {mensajes.filter(m => !m.disponible || m.disponible <= hora).map(m => <article key={m.id} className={m.autor === "Vos" ? "chat-propio" : ""}>
        <p className="micro">{m.autor} · <time dateTime={m.fecha}>{fechaHora(m.fecha)}</time></p><p>{m.texto}</p>
      </article>)}
      {ultimoDisponible > hora && <p className="nota" role="status">{agente.nombre.split(" ")[0]} está escribiendo…</p>}
    </div>
    <form className="formulario" onSubmit={enviar}>
      <label>Mensaje<input value={texto} maxLength={400} required onChange={event => setTexto(event.target.value)} /></label>
      <button type="submit" className="boton primario" disabled={!texto.trim()}>Enviar mensaje</button>
    </form>
  </section>;
}
