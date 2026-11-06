"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { origenes } from "@/lib/datos/catalogos";
import { estados } from "@/lib/dominio";
import { prepararReintento } from "@/lib/operacion";
import { fechaCorta } from "@/lib/precios";
import { useDatos } from "@/lib/storage";
import { Boleto, Historial, Pasos, SinDatos } from "./flujo";

export function PantallaReserva({ id }: { id: string }) {
  const { datos, listo } = useDatos();
  const router = useRouter();
  const bloqueo = useRef(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const reserva = datos.reservas[id];
  if (!reserva) return <SinDatos listo={listo} mensaje="Esta reserva no está guardada en el dispositivo." />;
  const { busqueda } = reserva.oferta.cotizacion;
  const emitida = reserva.estado === "emitida";
  const casos = Object.values(datos.casos).filter(caso => caso.reserva === id);
  const ultimo = reserva.historial.at(-1);

  async function reintentar() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setCargando(true);
    setError("");
    try {
      if (await prepararReintento(reserva, datos.generacion)) router.push("/pago?id=" + id);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No pudimos preparar el reintento.");
    } finally {
      bloqueo.current = false;
      setCargando(false);
    }
  }

  return <main id="contenido" className="marco interior">
    <Pasos actual={emitida ? 3 : 2}/>
    <p className="micro acento">RESERVA / {id}</p>
    <h1>{emitida ? "Tu viaje está confirmado." : reserva.estado === "en_revision" ? "Tu reserva quedó en revisión." : "Estado de tu reserva"}</h1>
    {emitida ? <><p className="bajada">Los tres servicios están confirmados. Tenés los documentos del viaje en el portal.</p>
      <Boleto reserva={reserva} origen={origenes[busqueda.origen]} fechas={fechaCorta(busqueda.ida) + " al " + fechaCorta(busqueda.vuelta)}/>
      <div className="acciones"><Link href={"/mis-viajes/" + id} className="boton exito">Ver itinerario y documentos <span aria-hidden="true">↗</span></Link></div></>
      : <div className="panel mt-4"><p className="micro acento">{estados[reserva.estado]}</p>
        <p>{ultimo?.detalle}</p>
        {casos.length > 0 && <p className="mt-3"><strong>Caso {casos.at(-1)?.id}</strong> · Podés seguirlo desde Mis viajes.</p>}
        <div className="acciones">
          {reserva.estado === "en_revision" && <button className="boton primario" type="button" disabled={cargando} onClick={reintentar}>{cargando ? "Revalidando…" : "Reintentar reserva"}</button>}
          {(reserva.estado === "validada" || reserva.estado === "pago_autorizado") && <Link href={"/pago?id=" + id} className="boton primario">Continuar el pago</Link>}
          {reserva.estado === "cotizada" && <Link href="/cotizacion" className="boton primario">Volver a cotizar</Link>}
          <Link href={"/mis-viajes/" + id} className="boton">Abrir Mis viajes</Link>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
      </div>}
    <details className="desplegable mt-7"><summary>Historial de la reserva</summary><Historial reserva={reserva}/></details>
  </main>;
}
