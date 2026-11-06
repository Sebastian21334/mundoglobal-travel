"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { estados, type Caso } from "@/lib/dominio";
import { fechaCorta, fechaHora, usd } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje, documentos, itinerario } from "@/lib/viaje";
import { Chat } from "./chat";
import { Historial, SinDatos } from "./flujo";

export function Viajes() {
  const { datos, listo } = useDatos();
  const viajes = Object.values(datos.reservas).filter(item => item.estado !== "cotizada").reverse();
  return <main id="contenido" className="marco interior">
    <p className="micro acento">PORTAL DEL VIAJERO</p><h1>Mis viajes</h1>
    <p className="bajada">Consultá tus reservas, descargá sus documentos al imprimirlos en PDF o pedí asistencia.</p>
    {!listo ? <p role="status">Cargando reservas…</p> : !viajes.length ? <section className="panel">
      <h2>Tus reservas aparecen acá.</h2><p className="mt-2">Este dispositivo todavía no tiene reservas registradas.</p>
      <Link className="boton primario mt-4" href="/#buscador">Armar un paquete</Link>
    </section> : <ul className="registros" aria-label="Reservas guardadas">
      {viajes.map(viaje => {
        const { busqueda, origen, precios } = detalleViaje(viaje);
        return <li key={viaje.id}><div><p className="micro acento">{viaje.id} / {estados[viaje.estado]}</p>
          <h2>{origen} → Punta Cana</h2><p>{fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)} · {busqueda.pasajeros} viajeros · {usd(precios.total)}</p></div>
          <Link className="boton" href={"/mis-viajes/" + viaje.id}>Ver viaje <span aria-hidden="true">↗</span></Link>
        </li>;
      })}
    </ul>}
  </main>;
}

export function Detalle({ id }: { id: string }) {
  const { datos, listo } = useDatos();
  const [tipo, setTipo] = useState("Solicitud de cambio");
  const [detalle, setDetalle] = useState("");
  const [mensaje, setMensaje] = useState("");
  const reserva = datos.reservas[id];
  if (!reserva) return <SinDatos listo={listo} mensaje="El viaje que buscás no está guardado en este dispositivo." />;
  const viaje = detalleViaje(reserva);
  const casos = Object.values(datos.casos).filter(caso => caso.reserva === id).reverse();
  const emitida = reserva.estado === "emitida";

  function crearCaso(event: FormEvent) {
    event.preventDefault();
    if (!detalle.trim()) return;
    const numero = "SOP-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const caso: Caso = {
      id: numero, reserva: id, etapa: tipo, proveedor: "Soporte Digital",
      detalle: detalle.trim(), creado: new Date().toISOString(), automatico: false,
    };
    actualizar(d => ({ ...d, casos: { ...d.casos, [numero]: caso } }));
    setDetalle("");
    setMensaje("Se creó el caso " + numero + ". Podés seguirlo en esta sección.");
  }

  return <main id="contenido" className="marco interior">
    <Link href="/mis-viajes" className="enlace">← Mis viajes</Link>
    <div className="titulo-fila"><div><p className="micro acento mt-4">{id} / {estados[reserva.estado]}</p><h1>Tu viaje a Punta Cana</h1></div></div>
    <p className="bajada">{viaje.origen} · {fechaCorta(viaje.busqueda.ida)} al {fechaCorta(viaje.busqueda.vuelta)} · {viaje.estadia} noches · {viaje.busqueda.pasajeros} viajeros</p>
    {!emitida && <div className="aviso">
      <h3>{estados[reserva.estado]}</h3><p>{reserva.historial.at(-1)?.detalle}</p>
      <Link href={"/reserva/" + id} className="boton">Ver estado y próximos pasos</Link>
    </div>}
    <div className="viaje-grid">
      <div className="pila">
        {emitida && <>
          <section className="panel"><p className="micro acento">AGENDA DEL VIAJERO</p><h2>Itinerario</h2>
            <ol className="itinerario">{itinerario(reserva).map((dia, i) => <li key={dia.fecha}>
              <svg viewBox="0 0 22 74" preserveAspectRatio="none" aria-hidden="true"><path d="M11 0v74" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4"/><circle cx="11" cy="13" r={i === 0 ? 5 : 3} fill="currentColor"/></svg>
              <div><p className="micro acento">DÍA {String(i + 1).padStart(2,"0")} / {fechaCorta(dia.fecha)}</p><h3>{dia.titulo}</h3><p>{dia.detalle}</p></div>
            </li>)}</ol>
          </section>
          <section className="panel"><p className="micro acento">INFORMACIÓN DE TU RESERVA</p><h2>Alertas</h2>
            <ul className="lista-alertas"><li><strong>Horario aéreo confirmado</strong><p>{viaje.vuelo.codigo} sale a las {viaje.vuelo.salida}. Presentate en el aeropuerto 3 h antes.</p></li>
              <li><strong>Ingreso al hotel</strong><p>{viaje.hotel.nombre} recibe huéspedes a partir de las 15:00 del {fechaCorta(viaje.busqueda.ida)}. Mostrá el voucher al llegar.</p></li></ul>
          </section>
        </>}
        <section className="panel"><p className="micro acento">CASOS / {id}</p><h2>Cambios y reclamos</h2>
          <form className="formulario" onSubmit={crearCaso}>
            <label>Tipo de solicitud<select value={tipo} onChange={e => setTipo(e.target.value)}><option>Solicitud de cambio</option><option>Reclamo</option><option>Consulta de cobertura</option></select></label>
            <label>Contanos qué necesitás<textarea required rows={3} maxLength={800} value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Por ejemplo, necesito mover la vuelta un día."/></label>
            <button type="submit" className="boton primario" disabled={!detalle.trim()}>Abrir un caso</button>
          </form>
          <p className="nota mt-2" role="status">{mensaje}</p>
          {casos.length > 0 && <ul className="lista-alertas" aria-label="Seguimiento de casos">{casos.map(caso => <li key={caso.id}>
            <p className="micro acento">{caso.id} / {caso.cerrado ? "Cerrado" : "Abierto"}</p><strong>{caso.etapa}</strong><p>{caso.detalle}</p>
            <p className="nota">Abierto {fechaHora(caso.creado)}{caso.cerrado ? " · Cerrado " + fechaHora(caso.cerrado) : ""}</p>
            {caso.resolucion && <p>{caso.resolucion}</p>}
          </li>)}</ul>}
        </section>
      </div>
      <div className="pila">
        {emitida && <section className="panel"><p className="micro acento">ARCHIVO DE VIAJE</p><h2>Documentos</h2>
          <ul className="lista-documentos">{Object.entries(documentos).map(([tipo, nombre]) =>
            <li key={tipo}><Link href={"/mis-viajes/" + id + "/documentos/" + tipo}>{nombre}<span aria-hidden="true">↗</span></Link></li>)}</ul>
        </section>}
        <Chat id={id}/>
        <details className="desplegable"><summary>Historial de la reserva</summary><Historial reserva={reserva}/></details>
      </div>
    </div>
  </main>;
}
