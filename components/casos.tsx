"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { nombreCompleto, usuarioActual } from "@/lib/cuenta";
import type { Caso, EstadoCaso } from "@/lib/dominio";
import { estadoCaso, estadosCaso, intervenir } from "@/lib/postventa";
import { fechaCorta, fechaHora } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje } from "@/lib/viaje";
import { Etiqueta, SinDatos, tonoCaso } from "./flujo";

export function EtapasCaso({ caso }: { caso: Caso }) {
  const actual = estadosCaso.indexOf(estadoCaso(caso));
  return <ol className="pasos pasos-caso" aria-label="Estado del caso">
    {estadosCaso.map((estado: EstadoCaso, i) => <li key={estado} aria-current={i === actual ? "step" : undefined} className={i < actual ? "pasado" : undefined}>
      <span>{String(i + 1).padStart(2, "0")}</span> {estado}
    </li>)}
  </ol>;
}

export function CasoViajero({ reservaId, id }: { reservaId: string; id: string }) {
  const { datos, listo } = useDatos();
  const [texto, setTexto] = useState("");
  const caso = datos.casos[id];
  const reserva = datos.reservas[reservaId];
  if (!caso || !reserva || caso.reserva !== reservaId) return <SinDatos listo={listo} mensaje="No encontramos este caso en este navegador." />;
  const usuario = usuarioActual(datos);
  const viaje = detalleViaje(reserva);
  const estado = estadoCaso(caso);
  const respuestas = (caso.intervenciones ?? []).filter(item => item.tipo === "respuesta");

  function responder(event: FormEvent) {
    event.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    const autor = usuario ? nombreCompleto(usuario) : "Viajero";
    const nuevo = intervenir(caso, { autor, rol: "Viajero" }, "respuesta", limpio, new Date().toISOString(), caso.estado === "Esperando al viajero" ? { estado: "En gestión" } : {});
    if (actualizar(d => ({ ...d, casos: { ...d.casos, [caso.id]: nuevo } }), datos.generacion)) setTexto("");
  }

  return <main id="contenido" className="marco interior">
    <Link href={"/mis-viajes/" + reservaId} className="enlace">← Tu viaje a {viaje.destino.nombre}</Link>
    <div className="titulo-fila"><div><p className="micro acento mt-4">CASO / {caso.id}</p><h1>{caso.etapa}</h1></div><Etiqueta tono={tonoCaso(estado)}>{estado}</Etiqueta></div>
    <EtapasCaso caso={caso}/>
    <div className="viaje-grid">
      <div className="pila">
        <section className="panel" aria-labelledby="titulo-respuestas">
          <p className="micro acento">SEGUIMIENTO</p><h2 id="titulo-respuestas">Respuestas</h2>
          <div className="chat-mensajes" role="log" aria-label="Respuestas del caso">
            <article className="chat-propio"><p className="micro">{caso.automatico ? "Sistema" : "Vos"} · <time dateTime={caso.creado}>{fechaHora(caso.creado)}</time></p><p>{caso.detalle}</p></article>
            {respuestas.map(item => <article key={item.id} className={item.rol === "Viajero" ? "chat-propio" : ""}>
              <p className="micro">{item.rol === "Viajero" ? "Vos" : item.autor + " · Soporte Digital"} · <time dateTime={item.fecha}>{fechaHora(item.fecha)}</time></p><p>{item.texto}</p>
            </article>)}
            {!respuestas.length && <p className="nota">Soporte Digital todavía no respondió este caso.</p>}
          </div>
          {caso.cerrado ? <p className="nota mt-3"><strong>Caso cerrado.</strong> {caso.resolucion}</p> : <form className="formulario" onSubmit={responder}>
            <label>Agregar un comentario<textarea rows={3} maxLength={800} required value={texto} onChange={e => setTexto(e.target.value)}/></label>
            <button type="submit" className="boton primario" disabled={!texto.trim()}>Enviar comentario</button>
          </form>}
        </section>
      </div>
      <div className="pila">
        <section className="panel"><p className="micro acento">DATOS DEL CASO</p><h2>Detalle</h2>
          <dl className="desglose">
            <div><dt>Reserva</dt><dd><Link href={"/mis-viajes/" + reservaId} className="enlace">{reservaId}</Link></dd></div>
            <div><dt>Viaje</dt><dd>{viaje.destino.nombre}, {fechaCorta(viaje.busqueda.ida)}</dd></div>
            <div><dt>Servicio</dt><dd>{caso.servicio ?? caso.proveedor}</dd></div>
            <div><dt>Abierto</dt><dd>{fechaHora(caso.creado)}</dd></div>
            <div><dt>Asignado a</dt><dd>{caso.asignado ?? "Sin asignar"}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  </main>;
}
