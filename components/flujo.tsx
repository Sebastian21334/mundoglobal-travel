"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { fechaCompleta, nombreCompleto } from "@/lib/cuenta";
import { estados, type EstadoCaso, type Estado, type Reserva } from "@/lib/dominio";
import { codigoDestino, destinos } from "@/lib/datos/destinos";
import { fechaHora, usd } from "@/lib/precios";
import { estadoServicios, type Tono } from "@/lib/viaje";

export function Pasos({ actual }: { actual: number }) {
  return <ol className="pasos" aria-label="Pasos de la reserva">
    {["Cotización", "Validación", "Pasajeros", "Pago y reserva", "Emisión"].map((paso, i) =>
      <li key={paso} aria-current={i === actual ? "step" : undefined} className={i < actual ? "pasado" : undefined}>
        <span>{String(i + 1).padStart(2, "0")}</span> {paso}
      </li>)}
  </ol>;
}

export function Etiqueta({ tono, children }: { tono: Tono; children: ReactNode }) {
  return <span className={"etiqueta " + tono}>{children}</span>;
}
export const tonoReserva = (estado: Estado): Tono => estado === "emitida" || estado === "confirmada" ? "ok" : estado === "en_revision" || estado === "cancelada" ? "alerta" : "pendiente";
export const tonoCaso = (estado: EstadoCaso): Tono => estado === "Cerrado" ? "ok" : estado === "Abierto" ? "alerta" : "pendiente";

export function EstadoServicios({ reserva }: { reserva: Reserva }) {
  return <section className="panel" aria-labelledby="titulo-servicios">
    <p className="micro acento">RESERVA COORDINADA / {reserva.id}</p><h2 id="titulo-servicios">Estado de los servicios</h2>
    <ul className="servicios-estado">
      {estadoServicios(reserva).map(item => <li key={item.servicio}>
        <div><strong>{item.servicio}</strong><p>{item.detalle}</p></div>
        <span className="servicios-ref">{item.referencia ?? "Sin referencia"}</span>
        <Etiqueta tono={item.tono}>{item.estado}</Etiqueta>
      </li>)}
      <li className="servicios-paquete">
        <div><strong>Paquete completo</strong><p>Identificador único de la reserva</p></div>
        <span className="servicios-ref">{reserva.id}</span>
        <Etiqueta tono={tonoReserva(reserva.estado)}>{estados[reserva.estado]}</Etiqueta>
      </li>
    </ul>
  </section>;
}

export function RegistroPago({ reserva }: { reserva: Reserva }) {
  const operaciones = reserva.operaciones ?? [];
  return <section className="panel" aria-labelledby="titulo-registro-pago">
    <p className="micro acento">PASARELA SIMULADA</p><h2 id="titulo-registro-pago">Registro del pago</h2>
    {!operaciones.length ? <p className="nota mt-2">Todavía no hay operaciones registradas para esta reserva.</p> : <ul className="lista-alertas">
      {operaciones.map((item, i) => <li key={i} className="registro-operacion">
        <div><strong>{item.operacion}</strong><p>{item.referencia}{item.detalle ? " · " + item.detalle : ""}</p><p className="nota">{fechaHora(item.fecha)} · {usd(item.importe)}</p></div>
        <Etiqueta tono={item.resultado === "Rechazada" || item.resultado === "Liberada" ? "alerta" : "ok"}>{item.resultado}</Etiqueta>
      </li>)}
    </ul>}
    {reserva.intento && <p className="nota mt-3"><strong>Protección contra doble cobro.</strong> Este intento usa la clave {reserva.intento.clave.slice(0, 8)}. Un reenvío devuelve la misma autorización y no genera un nuevo cobro.</p>}
  </section>;
}

export function ListaPasajeros({ reserva }: { reserva: Reserva }) {
  if (!reserva.pasajeros?.length) return null;
  return <ul className="lista-pasajeros">{reserva.pasajeros.map(item => <li key={item.id}>
    <div><strong>{nombreCompleto(item)}</strong><p>Pasaporte {item.documento} · {fechaCompleta(item.nacimiento)} · {item.nacionalidad}</p></div>
  </li>)}</ul>;
}

export function SinDatos({ listo, mensaje }: { listo: boolean; mensaje: string }) {
  return <main id="contenido" className="marco interior">
    <p className="micro acento">MUNDOGLOBAL TRAVEL</p>
    <h1>{listo ? "Empezá por una búsqueda." : "Cargando tu viaje…"}</h1>
    {listo && <><p className="bajada">{mensaje}</p><Link href="/#buscador" className="boton primario">Cotizar un paquete</Link></>}
  </main>;
}

export function Vigencia({ hasta }: { hasta: number }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const segundos = Math.max(0, Math.ceil((hasta - ahora) / 1000));
  const texto = String(Math.floor(segundos / 60)).padStart(2, "0") + ":" + String(segundos % 60).padStart(2, "0");
  return <span className="vigencia" role="timer" aria-label={segundos ? "Vigencia restante " + texto : "Cotización vencida"}>
    {segundos ? <>Vigencia <strong>{texto}</strong></> : "Cotización vencida"}
  </span>;
}

export function Historial({ reserva }: { reserva: Reserva }) {
  return <ol className="historial">
    {reserva.historial.map((evento, i) => <li key={i}>
      <span className="micro">{estados[evento.estado]}</span>
      <time dateTime={evento.fecha}>{fechaHora(evento.fecha)}</time>
      <p>{evento.detalle}</p>
    </li>)}
  </ol>;
}

function Codigo({ id }: { id: string }) {
  const bits = [...id].flatMap(letra => [...letra.charCodeAt(0).toString(2).padStart(7, "0")]);
  return <svg viewBox={"0 0 " + bits.length * 2 + " 42"} className="codigo" aria-hidden="true">
    {bits.map((bit, i) => bit === "1" ? <rect key={i} x={i * 2} width={i % 3 === 0 ? 1.8 : 1.2} height={i % 6 === 0 ? 39 : 34} fill="currentColor"/> : null)}
  </svg>;
}

export function Boleto({ reserva, origen, fechas }: { reserva: Reserva; origen: string; fechas: string }) {
  const { busqueda, precios } = reserva.oferta.cotizacion;
  const codigo = codigoDestino(busqueda);
  return <article className="boleto" aria-label="Comprobante de reserva">
    <div className="boleto-cuerpo">
      <div className="boleto-enc"><span>MUNDOGLOBAL TRAVEL</span><span>RESERVA EMITIDA</span></div>
      <div className="boleto-ruta"><div><span>ORIGEN</span><strong>{busqueda.origen}</strong><p>{origen}</p></div>
      <span className="boleto-flecha" aria-hidden="true">⟶</span>
      <div><span>DESTINO</span><strong>{codigo}</strong><p>{destinos[codigo].nombre}</p></div></div>
      <div className="boleto-datos"><div><span>FECHAS</span><p>{fechas}</p></div><div><span>VIAJEROS</span><p>{busqueda.pasajeros}</p></div><div><span>TOTAL PAGADO</span><p>{usd(precios.total)}</p></div></div>
    </div>
    <div className="boleto-talon"><span className="micro">LOCALIZADOR</span><strong>{reserva.id}</strong><Codigo id={reserva.id}/><span>VUELO + HOTEL + ASISTENCIA</span></div>
  </article>;
}
