"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { destinos, destinosDisponibles } from "@/lib/datos/destinos";
import type { Asistencia, Busqueda, Destino, Hotel, Oferta, Vuelo } from "@/lib/dominio";
import { solicitar } from "@/lib/http";
import { errorBusqueda, isoDia, noches, sumarDias } from "@/lib/precios";
import { actualizar, leer } from "@/lib/storage";
import { Destinos } from "./destinos";

export function Buscador() {
  const router = useRouter();
  const inicio = useRef<number | null>(null);
  useEffect(() => { inicio.current = Date.now(); }, []);
  const ocupado = useRef(false);
  const destinoInput = useRef<HTMLSelectElement>(null);
  const [busqueda, setBusqueda] = useState<Busqueda & { destino: Destino }>(() => {
    const ida = sumarDias(isoDia(Date.now()), 35);
    return { origen: "EZE", destino: "PUJ", ida, vuelta: sumarDias(ida, 7), pasajeros: 2 };
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const duracion = noches(busqueda);

  function elegirDestino(destino: Destino, enfocar = false) {
    if (ocupado.current) return;
    setBusqueda(anterior => ({ ...anterior, destino }));
    setError("");
    if (enfocar) destinoInput.current?.focus();
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado.current) return;
    const invalidacion = errorBusqueda(busqueda);
    if (invalidacion) { setError(invalidacion); return; }
    const desde = inicio.current ?? Date.now();
    const { generacion } = leer();
    ocupado.current = true;
    setCargando(true);
    setError("");
    try {
      const [vuelos, hoteles, asistencias] = await Promise.all([
        solicitar<Vuelo[]>("vuelos", busqueda), solicitar<Hotel[]>("hoteles", busqueda),
        solicitar<Asistencia[]>("asistencia", busqueda),
      ]);
      const seleccion = { vuelo: vuelos[0].id, hotel: hoteles[0].id, asistencia: asistencias[0].id };
      const oferta = await solicitar<Oferta>("cotizar", { busqueda, seleccion });
      const id = oferta.cotizacion.id;
      const guardada = actualizar(datos => ({
        ...datos, borrador: { id, catalogo: { vuelos, hoteles, asistencias }, seleccion },
        reservas: { ...datos.reservas, [id]: {
          id, oferta, estado: "cotizada", cotizacionMs: Date.now() - desde,
          historial: [{ estado: "cotizada", fecha: new Date().toISOString(), detalle: "Vuelo, hotel y asistencia cotizados en un paquete." }],
        } },
      }), generacion);
      if (guardada) router.push("/cotizacion");
      else setError("Se restableció la demo mientras cotizabas. Podés volver a buscar.");
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No pudimos consultar los servicios. Volvé a intentar.");
    } finally {
      ocupado.current = false;
      setCargando(false);
    }
  }

  return <><section id="buscador" className="buscador" aria-labelledby="titulo-buscador">
    <div className="buscador-titulo"><div><p className="micro">RESERVAS / {busqueda.destino}</p><h2 id="titulo-buscador">Armá tu paquete</h2></div>
      <span className="duracion">{duracion >= 5 && duracion <= 14 ? duracion + " noches" : "5 a 14 noches"}</span>
    </div>
    <form onSubmit={enviar} aria-busy={cargando}>
      <fieldset className="campos campos-destinos" disabled={cargando}>
        <label>Destino<select ref={destinoInput} value={busqueda.destino} onChange={e => elegirDestino(e.target.value as Destino)}>
          {destinosDisponibles.map(codigo => <option value={codigo} key={codigo}>{destinos[codigo].nombre} · {codigo}</option>)}
        </select></label>
        <label>Salida desde<select value={busqueda.origen} onChange={e => setBusqueda({ ...busqueda, origen: e.target.value as Busqueda["origen"] })}>
          <option value="EZE">Buenos Aires · EZE</option><option value="COR">Córdoba · COR</option>
        </select></label>
        <label>Ida<input type="date" value={busqueda.ida} required onChange={e => {
          const ida = e.target.value;
          setBusqueda({ ...busqueda, ida, vuelta: ida && (!busqueda.vuelta || busqueda.vuelta <= ida) ? sumarDias(ida, 7) : busqueda.vuelta });
        }}/></label>
        <label>Vuelta<input type="date" value={busqueda.vuelta} required onChange={e => setBusqueda({ ...busqueda, vuelta: e.target.value })}/></label>
        <label>Viajeros<select value={busqueda.pasajeros} onChange={e => setBusqueda({ ...busqueda, pasajeros: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? "viajero" : "viajeros"}</option>)}
        </select></label>
        <button type="submit" className="boton primario" disabled={cargando}>{cargando ? "Cotizando…" : "Cotizar paquete"} <span aria-hidden="true">↗</span></button>
      </fieldset>
      {error && <p role="alert" className="error">{error}</p>}
      <p className="solo-lectores" role="status">{cargando ? "Consultando vuelo, hotel y asistencia." : ""}</p>
    </form>
  </section><Destinos seleccionado={busqueda.destino} elegir={destino => elegirDestino(destino, true)}/></>;
}
