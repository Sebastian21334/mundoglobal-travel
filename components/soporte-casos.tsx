"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { agentes } from "@/lib/agentes";
import { estados, type Caso, type EstadoCaso, type Intervencion } from "@/lib/dominio";
import { cambiarEstado, crearAviso, enlaceCaso, estadoCaso, estadosCaso, intervenir } from "@/lib/postventa";
import { fechaCorta, fechaHora } from "@/lib/precios";
import { actualizar, useDatos } from "@/lib/storage";
import { detalleViaje } from "@/lib/viaje";
import { EtapasCaso } from "./casos";
import { Etiqueta, EstadoServicios, tonoCaso, tonoReserva } from "./flujo";
import { agenteActual, duracion, MarcoSoporte } from "./soporte";

export function SoporteCasos() {
  const { datos } = useDatos();
  const [filtro, setFiltro] = useState("abiertos");
  const casos = Object.values(datos.casos).reverse();
  const filtrados = filtro === "todos" ? casos : casos.filter(caso => filtro === "abiertos" ? !caso.cerrado : Boolean(caso.cerrado));

  return <MarcoSoporte activo="casos" titulo="Casos" bajada="Registro de incidencias, cambios y reclamos con su seguimiento.">
    <div className="filtros-soporte filtros-casos">
      <label>Mostrar<select value={filtro} onChange={e => setFiltro(e.target.value)}><option value="abiertos">Abiertos</option><option value="cerrados">Cerrados</option><option value="todos">Todos</option></select></label>
    </div>
    {!filtrados.length ? <p className="nota mt-3">No hay casos para este filtro.</p> : <div className="tabla-scroll" tabIndex={0} role="region" aria-label="Tabla de casos">
      <table className="tabla"><thead><tr>{["Caso y reserva", "Etapa y proveedor", "Incidencia", "Asignado a", "Tiempo de resolución", "Estado", ""].map(col => <th key={col} scope="col">{col}</th>)}</tr></thead>
        <tbody>{filtrados.map(caso => <tr key={caso.id}><th scope="row">{caso.id}<br/><Link href={"/soporte/reservas/" + caso.reserva} className="enlace">{caso.reserva}</Link></th>
          <td>{caso.etapa}<br/><span className="nota">{caso.proveedor}</span></td><td>{caso.detalle}</td><td>{caso.asignado ?? "Sin asignar"}</td>
          <td>{caso.cerrado ? duracion(Date.parse(caso.cerrado) - Date.parse(caso.creado)) : "Pendiente"}<br/><span className="nota">{fechaHora(caso.creado)}</span></td>
          <td><Etiqueta tono={tonoCaso(estadoCaso(caso))}>{estadoCaso(caso)}</Etiqueta></td>
          <td><Link href={"/soporte/casos/" + caso.id} className="boton">Atender</Link></td>
        </tr>)}</tbody></table>
    </div>}
  </MarcoSoporte>;
}

const rotulos: Record<Intervencion["tipo"], string> = { respuesta: "Respuesta", nota: "Nota interna", estado: "Actualización" };

export function SoporteCaso({ id }: { id: string }) {
  const { datos } = useDatos();
  const [tipo, setTipo] = useState<"respuesta" | "nota">("respuesta");
  const [texto, setTexto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const caso = datos.casos[id];
  const agente = agenteActual(datos);
  if (!caso) return <MarcoSoporte activo="casos" titulo="Caso no encontrado"><Link href="/soporte/casos" className="enlace">← Volver a Casos</Link></MarcoSoporte>;
  const reserva = datos.reservas[caso.reserva];
  const estado = estadoCaso(caso);
  const autor = agente?.nombre ?? "Soporte Digital";

  function guardar(nuevo: Caso, aviso: string, notificar?: { titulo: string; detalle: string }) {
    const fecha = new Date().toISOString();
    const avisos = notificar ? [crearAviso(caso.reserva, "Caso", notificar.titulo, notificar.detalle, fecha, enlaceCaso(caso))] : [];
    if (actualizar(d => ({ ...d, casos: { ...d.casos, [caso.id]: nuevo }, avisos: [...avisos, ...d.avisos] }), datos.generacion)) setMensaje(aviso);
  }

  function actualizarEstado(nuevo: EstadoCaso) {
    guardar(cambiarEstado(caso, autor, nuevo, new Date().toISOString()), "Estado actualizado a " + nuevo + ".",
      { titulo: "Tu caso " + caso.id + " cambió de estado", detalle: "Ahora está: " + nuevo + "." });
  }

  function asignar(nombre: string) {
    guardar(intervenir(caso, { autor, rol: "Soporte" }, "estado", nombre ? "Caso asignado a " + nombre + "." : "Caso sin asignar.", new Date().toISOString(), { asignado: nombre || undefined }),
      nombre ? "Caso asignado a " + nombre + "." : "Caso sin asignar.");
  }

  function intervenciones(event: FormEvent) {
    event.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    const cambios = tipo === "respuesta" && estado === "Abierto" ? { estado: "En gestión" as const, asignado: caso.asignado ?? autor } : {};
    const nuevo = intervenir(caso, { autor, rol: "Soporte" }, tipo, limpio, new Date().toISOString(), cambios);
    if (tipo === "respuesta") guardar(nuevo, "Respuesta enviada al viajero.", { titulo: "Soporte respondió tu caso " + caso.id, detalle: limpio });
    else guardar(nuevo, "Nota interna guardada.");
    setTexto("");
  }

  return <MarcoSoporte activo="casos" titulo={caso.etapa}>
    <Link href="/soporte/casos" className="enlace">← Volver a Casos</Link>
    <p className="micro acento mt-3 mb-3">CASO / {caso.id} {caso.automatico ? "· GENERADO POR EL SISTEMA" : ""}</p>
    <EtapasCaso caso={caso}/>
    <div className="viaje-grid">
      <div className="pila">
        <section className="panel"><p className="micro acento">MOTIVO</p><h2>Qué pasó</h2><p className="mt-2">{caso.detalle}</p>
          {caso.resolucion && <p className="nota mt-3"><strong>Resolución.</strong> {caso.resolucion}</p>}
        </section>
        <section className="panel" aria-labelledby="titulo-intervenir"><p className="micro acento">ATENCIÓN DEL CASO</p><h2 id="titulo-intervenir">Registrar intervención</h2>
          <form className="formulario" onSubmit={intervenciones}>
            <label>Tipo<select value={tipo} onChange={e => setTipo(e.target.value as "respuesta" | "nota")}><option value="respuesta">Respuesta al viajero</option><option value="nota">Nota interna</option></select></label>
            <label>Mensaje<textarea rows={3} maxLength={800} required value={texto} onChange={e => setTexto(e.target.value)}/></label>
            <button type="submit" className="boton primario" disabled={!texto.trim()}>{tipo === "respuesta" ? "Enviar respuesta" : "Guardar nota"}</button>
          </form>
          <p className="nota mt-2" role="status">{mensaje}</p>
        </section>
        <section className="panel"><p className="micro acento">TRAZABILIDAD</p><h2>Historial de intervenciones</h2>
          <ol className="historial">
            <li><span className="micro">Apertura</span><time dateTime={caso.creado}>{fechaHora(caso.creado)}</time><p>{caso.automatico ? "Caso generado automáticamente por " + caso.proveedor + "." : "Solicitud iniciada por el viajero desde el portal."}</p></li>
            {(caso.intervenciones ?? []).map(item => <li key={item.id}><span className="micro">{rotulos[item.tipo]} · {item.autor}</span><time dateTime={item.fecha}>{fechaHora(item.fecha)}</time><p>{item.texto}</p></li>)}
          </ol>
        </section>
      </div>
      <div className="pila">
        <section className="panel"><p className="micro acento">GESTIÓN</p><h2>Actualizar caso</h2>
          <div className="formulario">
            <label>Estado<select value={estado} onChange={e => actualizarEstado(e.target.value as EstadoCaso)}>{estadosCaso.map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Asignado a<select value={caso.asignado ?? ""} onChange={e => asignar(e.target.value)}><option value="">Sin asignar</option>{agentes.map(item => <option key={item.email}>{item.nombre}</option>)}</select></label>
          </div>
        </section>
        {reserva && <section className="panel"><p className="micro acento">RESERVA VINCULADA</p><h2>{detalleViaje(reserva).destino.nombre}</h2>
          <dl className="desglose">
            <div><dt>Localizador</dt><dd><Link href={"/soporte/reservas/" + reserva.id} className="enlace">{reserva.id}</Link></dd></div>
            <div><dt>Salida</dt><dd>{fechaCorta(reserva.oferta.cotizacion.busqueda.ida)}</dd></div>
            <div><dt>Estado</dt><dd><Etiqueta tono={tonoReserva(reserva.estado)}>{estados[reserva.estado]}</Etiqueta></dd></div>
          </dl>
        </section>}
        {reserva && <EstadoServicios reserva={reserva}/>}
      </div>
    </div>
  </MarcoSoporte>;
}
