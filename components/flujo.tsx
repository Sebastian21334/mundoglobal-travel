"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { estados, type Reserva } from "@/lib/dominio";
import { fechaHora, usd } from "@/lib/precios";

export function Pasos({ actual }: { actual: number }) {
  return <ol className="pasos" aria-label="Pasos de la reserva">
    {["Cotización", "Validación", "Pago y reserva", "Emisión"].map((paso, i) =>
      <li key={paso} aria-current={i === actual ? "step" : undefined} className={i < actual ? "pasado" : undefined}>
        <span>{String(i + 1).padStart(2, "0")}</span> {paso}
      </li>)}
  </ol>;
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
  return <article className="boleto" aria-label="Comprobante de reserva">
    <div className="boleto-cuerpo">
      <div className="boleto-enc"><span>MUNDOGLOBAL TRAVEL</span><span>RESERVA EMITIDA</span></div>
      <div className="boleto-ruta"><div><span>ORIGEN</span><strong>{busqueda.origen}</strong><p>{origen}</p></div>
      <span className="boleto-flecha" aria-hidden="true">⟶</span>
      <div><span>DESTINO</span><strong>PUJ</strong><p>Punta Cana</p></div></div>
      <div className="boleto-datos"><div><span>FECHAS</span><p>{fechas}</p></div><div><span>VIAJEROS</span><p>{busqueda.pasajeros}</p></div><div><span>TOTAL PAGADO</span><p>{usd(precios.total)}</p></div></div>
    </div>
    <div className="boleto-talon"><span className="micro">LOCALIZADOR</span><strong>{reserva.id}</strong><Codigo id={reserva.id}/><span>VUELO + HOTEL + ASISTENCIA</span></div>
  </article>;
}
