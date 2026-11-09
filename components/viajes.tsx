"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { estados, type Caso } from "@/lib/dominio";
import { crearAviso, enlaceCaso, estadoCaso } from "@/lib/postventa";
import { cantidadViajeros, fechaCorta, fechaHora, usd } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";
import { descargarDocumento, detalleViaje, documentos, itinerario, type TipoDocumento } from "@/lib/viaje";
import { Chat } from "./chat";
import { FotoHotel } from "./foto-hotel";
import { Etiqueta, EstadoServicios, Historial, ListaPasajeros, SinDatos, tonoCaso, tonoReserva } from "./flujo";

export function Viajes() {
  const { datos, listo } = useDatos();
  const viajes = Object.values(datos.reservas).filter(item => item.estado !== "cotizada").reverse();
  const casos = Object.values(datos.casos).reverse();
  return <main id="contenido" className="marco interior">
    <p className="micro acento">PORTAL DEL VIAJERO</p><h1>Mis viajes</h1>
    <p className="bajada">Consultá tus reservas, el estado de cada compra, los documentos del viaje y tus solicitudes.</p>
    {!listo ? <p role="status">Cargando reservas…</p> : !viajes.length ? <section className="panel">
      <h2>Tus reservas aparecen acá.</h2><p className="mt-2">Este dispositivo todavía no tiene reservas registradas.</p>
      <Link className="boton primario mt-4" href="/#buscador">Armar un paquete</Link>
    </section> : <ul className="registros" aria-label="Reservas guardadas">
      {viajes.map(viaje => {
        const { busqueda, origen, precios, destino } = detalleViaje(viaje);
        return <li key={viaje.id}><div className="viaje-ficha">
          <Image src={destino.foto.src} alt={destino.foto.alt} width={960} height={640} sizes="(max-width: 570px) 96px, 140px" className="viaje-miniatura"/>
          <div><p className="micro acento">{viaje.id}</p>
          <h2>{origen} → {destino.nombre}</h2><p>{fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)} · {cantidadViajeros(busqueda.pasajeros)} · {usd(precios.total)}</p></div></div>
          <div className="fila-acciones"><Etiqueta tono={tonoReserva(viaje.estado)}>{estados[viaje.estado]}</Etiqueta><Link className="boton" href={"/mis-viajes/" + viaje.id}>Ver viaje <span aria-hidden="true">↗</span></Link></div>
        </li>;
      })}
    </ul>}
    {casos.length > 0 && <section className="panel mt-6" aria-labelledby="titulo-solicitudes">
      <p className="micro acento">SEGUIMIENTO</p><h2 id="titulo-solicitudes">Mis solicitudes</h2>
      <ul className="lista-alertas">{casos.map(caso => <li key={caso.id} className="registro-operacion">
        <div><p className="micro acento">{caso.id} / {caso.reserva}</p><strong>{caso.etapa}</strong><p>{caso.detalle}</p></div>
        <div className="fila-acciones"><Etiqueta tono={tonoCaso(estadoCaso(caso))}>{estadoCaso(caso)}</Etiqueta><Link href={enlaceCaso(caso)} className="enlace">Ver seguimiento ↗</Link></div>
      </li>)}</ul>
    </section>}
  </main>;
}

export function Detalle({ id }: { id: string }) {
  const { datos, listo } = useDatos();
  const [tipo, setTipo] = useState("Solicitud de cambio");
  const [servicio, setServicio] = useState("Paquete completo");
  const [detalle, setDetalle] = useState("");
  const [creado, setCreado] = useState<Caso | null>(null);
  const reserva = datos.reservas[id];
  if (!reserva) return <SinDatos listo={listo} mensaje="El viaje que buscás no está guardado en este dispositivo." />;
  const viaje = detalleViaje(reserva);
  const casos = Object.values(datos.casos).filter(caso => caso.reserva === id).reverse();
  const avisos = datos.avisos.filter(aviso => aviso.reserva === id);
  const emitida = reserva.estado === "emitida";

  function crearCaso(event: FormEvent) {
    event.preventDefault();
    if (!detalle.trim()) return;
    const numero = "SOP-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const caso: Caso = {
      id: numero, reserva: id, etapa: tipo, proveedor: "Soporte Digital", servicio,
      detalle: detalle.trim(), creado: new Date().toISOString(), automatico: false,
    };
    const aviso = crearAviso(id, "Caso", "Recibimos tu solicitud " + numero, "Soporte Digital va a responderte en este caso.", caso.creado, enlaceCaso(caso));
    if (!actualizar(d => ({ ...d, casos: { ...d.casos, [numero]: caso }, avisos: [aviso, ...d.avisos] }), datos.generacion)) return;
    setDetalle("");
    setCreado(caso);
  }

  return <main id="contenido" className="marco interior">
    <Link href="/mis-viajes" className="enlace">← Mis viajes</Link>
    <div className="titulo-fila"><div><p className="micro acento mt-4">{id} / {estados[reserva.estado]}</p><h1>Tu viaje a {viaje.destino.nombre}</h1></div></div>
    <p className="bajada">{viaje.origen} · {fechaCorta(viaje.busqueda.ida)} al {fechaCorta(viaje.busqueda.vuelta)} · {viaje.estadia} noches · {cantidadViajeros(viaje.busqueda.pasajeros)}</p>
    {!emitida && <div className="aviso">
      <h3>{estados[reserva.estado]}</h3><p>{reserva.historial.at(-1)?.detalle}</p>
      <Link href={"/reserva/" + id} className="boton">Ver estado y próximos pasos</Link>
    </div>}
    <div className="viaje-grid">
      <div className="pila">
        <EstadoServicios reserva={reserva}/>
        {emitida && <section className="panel"><p className="micro acento">AGENDA DEL VIAJERO</p><h2>Itinerario</h2>
          <ol className="itinerario">{itinerario(reserva).map((dia, i) => <li key={dia.fecha}>
            <svg viewBox="0 0 22 74" preserveAspectRatio="none" aria-hidden="true"><path d="M11 0v74" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4"/><circle cx="11" cy="13" r={i === 0 ? 5 : 3} fill="currentColor"/></svg>
            <div><p className="micro acento">DÍA {String(i + 1).padStart(2,"0")} / {fechaCorta(dia.fecha)}</p><h3>{dia.titulo}</h3><p>{dia.detalle}</p></div>
          </li>)}</ol>
        </section>}
        {(emitida || avisos.length > 0) && <section className="panel"><p className="micro acento">INFORMACIÓN DE TU RESERVA</p><h2>Alertas</h2>
          {emitida && <figure className="estadia-foto">
            <FotoHotel id={viaje.hotel.id} className="destino-foto" sizes="(max-width: 640px) 90vw, 450px"/>
            <figcaption className="nota">Foto de referencia del alojamiento simulado</figcaption>
          </figure>}
          <ul className="lista-alertas">
            {avisos.map(aviso => <li key={aviso.id}><p className="micro acento">{aviso.tipo} / {fechaHora(aviso.fecha)}</p><strong>{aviso.titulo}</strong><p>{aviso.detalle}</p></li>)}
            {emitida && <><li><strong>Horario aéreo confirmado</strong><p>{viaje.vuelo.codigo} sale a las {viaje.vuelo.salida}. Presentate en el aeropuerto 3 h antes.</p></li>
            <li><strong>Ingreso al hotel</strong><p>{viaje.hotel.nombre} recibe huéspedes a partir de las 15:00 del {fechaCorta(viaje.busqueda.ida)}. Mostrá el voucher al llegar.</p></li></>}
          </ul>
        </section>}
        <section className="panel"><p className="micro acento">CASOS / {id}</p><h2>Cambios y reclamos</h2>
          <form className="formulario" onSubmit={crearCaso}>
            <div className="campos-dobles">
              <label>Tipo de solicitud<select value={tipo} onChange={e => setTipo(e.target.value)}><option>Solicitud de cambio</option><option>Reclamo</option><option>Consulta de cobertura</option></select></label>
              <label>Servicio afectado<select value={servicio} onChange={e => setServicio(e.target.value)}><option>Paquete completo</option><option>Vuelo</option><option>Hotel</option><option>Asistencia</option></select></label>
            </div>
            <label>Motivo<textarea required rows={3} maxLength={800} value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Por ejemplo, necesito mover la vuelta un día."/></label>
            <button type="submit" className="boton primario" disabled={!detalle.trim()}>Abrir un caso</button>
          </form>
          <p className="nota mt-2" role="status">{creado && <>Se creó el caso {creado.id}. <Link href={enlaceCaso(creado)} className="enlace">Ver seguimiento ↗</Link></>}</p>
          {casos.length > 0 && <ul className="lista-alertas" aria-label="Seguimiento de casos">{casos.map(caso => <li key={caso.id} className="registro-operacion">
            <div><p className="micro acento">{caso.id}</p><strong>{caso.etapa}</strong><p>{caso.detalle}</p>
            <p className="nota">Abierto {fechaHora(caso.creado)}{caso.cerrado ? " · Cerrado " + fechaHora(caso.cerrado) : ""}</p>
            {caso.resolucion && <p>{caso.resolucion}</p>}</div>
            <div className="fila-acciones"><Etiqueta tono={tonoCaso(estadoCaso(caso))}>{estadoCaso(caso)}</Etiqueta><Link href={enlaceCaso(caso)} className="enlace">Ver seguimiento ↗</Link></div>
          </li>)}</ul>}
        </section>
      </div>
      <div className="pila">
        {emitida && <section className="panel"><p className="micro acento">ARCHIVO DE VIAJE</p><h2>Documentos</h2>
          <ul className="lista-documentos">{Object.entries(documentos).map(([clave, nombre]) =>
            <li key={clave}><Link href={"/mis-viajes/" + id + "/documentos/" + clave}>{nombre}<span aria-hidden="true">↗</span></Link>
              <button type="button" className="enlace" aria-label={"Descargar " + nombre + " en PDF"} onClick={() => descargarDocumento(reserva, clave as TipoDocumento)}>Descargar PDF</button></li>)}</ul>
        </section>}
        {reserva.pasajeros?.length ? <section className="panel"><p className="micro acento">QUIÉNES VIAJAN</p><h2>Pasajeros</h2><ListaPasajeros reserva={reserva}/></section> : null}
        <Chat id={id}/>
        <details className="desplegable"><summary>Historial de la reserva</summary><Historial reserva={reserva}/></details>
      </div>
    </div>
  </main>;
}
