"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { nombreCompleto } from "@/lib/cuenta";
import { estados, type Estado, type Reserva, type TipoAviso } from "@/lib/dominio";
import { crearAviso, estadoCaso } from "@/lib/postventa";
import { cantidadViajeros, fechaCorta, fechaHora, usd } from "@/lib/precios";
import { registrar } from "@/lib/reserva";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje } from "@/lib/viaje";
import { Etiqueta, EstadoServicios, Historial, ListaPasajeros, RegistroPago, tonoCaso, tonoReserva } from "./flujo";
import { agenteActual, MarcoSoporte } from "./soporte";

const ultimaActividad = (reserva: Reserva) => reserva.historial.at(-1)?.fecha ?? "";

export function SoporteReservas() {
  const { datos } = useDatos();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<Estado | "todas">("todas");
  const termino = busqueda.trim().toLowerCase();
  const textoBuscable = (reserva: Reserva) => {
    const viaje = detalleViaje(reserva);
    return [reserva.id, viaje.destino.nombre, viaje.origen, reserva.titular ?? "", ...(reserva.pasajeros ?? []).map(nombreCompleto)].join(" ").toLowerCase();
  };
  const filas = Object.values(datos.reservas)
    .filter(reserva => (estado === "todas" || reserva.estado === estado) && (!termino || textoBuscable(reserva).includes(termino)))
    .sort((a, b) => ultimaActividad(b).localeCompare(ultimaActividad(a)));

  return <MarcoSoporte activo="reservas" titulo="Reservas" bajada="Consultá cualquier reserva por localizador, pasajero o destino.">
    <div className="filtros-soporte">
      <label>Buscar<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Localizador, pasajero o destino"/></label>
      <label>Estado<select value={estado} onChange={e => setEstado(e.target.value as Estado | "todas")}>
        <option value="todas">Todos</option>{Object.entries(estados).map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}
      </select></label>
    </div>
    {!filas.length ? <p className="nota mt-3">No hay reservas para esa búsqueda. Podés cargar los datos de ejemplo desde Modo demostración, en el pie de la página.</p>
      : <div className="tabla-scroll" tabIndex={0} role="region" aria-label="Tabla de reservas">
        <table className="tabla"><thead><tr>{["Localizador", "Pasajeros", "Viaje", "Total", "Estado", "Última actividad", ""].map(col => <th key={col} scope="col">{col}</th>)}</tr></thead>
          <tbody>{filas.map(reserva => {
            const viaje = detalleViaje(reserva);
            return <tr key={reserva.id}><th scope="row">{reserva.id}</th>
              <td>{reserva.pasajeros?.map(nombreCompleto).join(", ") ?? "Sin asignar"}</td>
              <td>{viaje.origen} → {viaje.destino.nombre}<br/><span className="nota">{fechaCorta(viaje.busqueda.ida)} al {fechaCorta(viaje.busqueda.vuelta)}</span></td>
              <td className="celda-fija">{usd(viaje.precios.total)}</td>
              <td><Etiqueta tono={tonoReserva(reserva.estado)}>{estados[reserva.estado]}</Etiqueta></td>
              <td>{fechaHora(ultimaActividad(reserva))}</td>
              <td><Link href={"/soporte/reservas/" + reserva.id} className="boton">Ver ficha</Link></td></tr>;
          })}</tbody></table>
      </div>}
  </MarcoSoporte>;
}

export function SoporteReserva({ id }: { id: string }) {
  const { datos } = useDatos();
  const [tipo, setTipo] = useState<TipoAviso>("Variación");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [mensaje, setMensaje] = useState("");
  const reserva = datos.reservas[id];
  const agente = agenteActual(datos);
  if (!reserva) return <MarcoSoporte activo="reservas" titulo="Reserva no encontrada"><Link href="/soporte/reservas" className="enlace">← Volver a Reservas</Link></MarcoSoporte>;
  const viaje = detalleViaje(reserva);
  const casos = Object.values(datos.casos).filter(caso => caso.reserva === id).reverse();
  const mensajes = datos.chats[id]?.length ?? 0;

  function enviarAviso(event: FormEvent) {
    event.preventDefault();
    if (!agente || !titulo.trim() || !detalle.trim()) return;
    const fecha = new Date().toISOString();
    const anotada = registrar(reserva, agente.nombre + " envió al viajero el aviso «" + titulo.trim() + "».", fecha);
    const aviso = crearAviso(id, tipo, titulo.trim(), detalle.trim(), fecha);
    if (!actualizar(d => ({ ...d, reservas: { ...d.reservas, [id]: anotada }, avisos: [aviso, ...d.avisos] }), datos.generacion)) return;
    setTitulo(""); setDetalle(""); setMensaje("Aviso enviado al viajero y registrado en el historial.");
  }

  return <MarcoSoporte activo="reservas" titulo={viaje.destino.nombre} bajada={viaje.origen + " · " + fechaCorta(viaje.busqueda.ida) + " al " + fechaCorta(viaje.busqueda.vuelta) + " · " + cantidadViajeros(viaje.busqueda.pasajeros) + " · " + usd(viaje.precios.total)}>
    <Link href="/soporte/reservas" className="enlace">← Volver a Reservas</Link>
    <div className="viaje-grid mt-3">
      <div className="pila">
        <EstadoServicios reserva={reserva}/>
        <RegistroPago reserva={reserva}/>
        <section className="panel"><p className="micro acento">TRAZABILIDAD</p><h2>Historial de la reserva</h2><Historial reserva={reserva}/></section>
      </div>
      <div className="pila">
        <section className="panel"><p className="micro acento">PASAJEROS</p><h2>Quiénes viajan</h2>
          {reserva.titular && <p className="nota">Cuenta titular: {reserva.titular}</p>}
          {reserva.pasajeros?.length ? <ListaPasajeros reserva={reserva}/> : <p className="nota mt-2">Todavía no se asignaron pasajeros.</p>}
        </section>
        <section className="panel"><p className="micro acento">CASOS VINCULADOS</p><h2>Casos</h2>
          {casos.length ? <ul className="lista-alertas">{casos.map(caso => <li key={caso.id} className="registro-operacion">
            <div><strong>{caso.id}</strong><p>{caso.etapa}</p></div>
            <div className="fila-acciones"><Etiqueta tono={tonoCaso(estadoCaso(caso))}>{estadoCaso(caso)}</Etiqueta><Link href={"/soporte/casos/" + caso.id} className="enlace">Atender ↗</Link></div>
          </li>)}</ul> : <p className="nota mt-2">Esta reserva no tiene casos.</p>}
          <p className="nota mt-3">{mensajes ? <Link href={"/soporte/chats?reserva=" + id} className="enlace">Abrir conversación ({mensajes} mensajes) ↗</Link> : "Sin conversaciones de chat."}</p>
        </section>
        <section className="panel"><p className="micro acento">COMUNICACIÓN AL VIAJERO</p><h2>Enviar aviso</h2>
          <form className="formulario" onSubmit={enviarAviso}>
            <label>Tipo<select value={tipo} onChange={e => setTipo(e.target.value as TipoAviso)}><option>Variación</option><option>Incidencia</option><option>Confirmación</option></select></label>
            <label>Título<input required maxLength={80} value={titulo} onChange={e => { setTitulo(e.target.value); setMensaje(""); }} placeholder="Por ejemplo, cambió la puerta de embarque"/></label>
            <label>Detalle<textarea required rows={3} maxLength={400} value={detalle} onChange={e => setDetalle(e.target.value)}/></label>
            <button type="submit" className="boton primario" disabled={!titulo.trim() || !detalle.trim()}>Enviar aviso</button>
          </form>
          <p className="nota mt-2" role="status">{mensaje}</p>
        </section>
      </div>
    </div>
  </MarcoSoporte>;
}
