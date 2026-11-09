"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { origenes } from "@/lib/datos/catalogos";
import { codigoDestino, destinos } from "@/lib/datos/destinos";
import { fechaCompleta, nombreCompleto, usuarioActual, viajeros } from "@/lib/cuenta";
import type { Pasajero, Usuario } from "@/lib/dominio";
import { guardarPasajero, quitarPasajero } from "@/lib/operacion";
import { cantidadViajeros, fechaCorta, usd } from "@/lib/precios";
import { registrar } from "@/lib/reserva";
import { guardarReserva, useDatos } from "@/lib/storage";
import { ChatFlotante } from "./chat";
import { Etiqueta, Pasos, SinDatos, Vigencia } from "./flujo";

const vacio = { nombre: "", apellido: "", documento: "", nacimiento: "", nacionalidad: "Argentina" };

export function FormPasajero({ inicial, accion, guardar, cancelar }: { inicial?: Pasajero; accion: string; guardar: (pasajero: Pasajero) => void; cancelar?: () => void }) {
  const [campos, setCampos] = useState<Omit<Pasajero, "id">>(inicial ?? vacio);
  const cambiar = (nombre: keyof typeof vacio) => (event: { target: { value: string } }) => setCampos({ ...campos, [nombre]: event.target.value });

  function enviar(event: FormEvent) {
    event.preventDefault();
    guardar({ ...campos, id: inicial?.id ?? crypto.randomUUID() });
    if (!inicial) setCampos(vacio);
  }

  return <form className="formulario" onSubmit={enviar}>
    <div className="campos-dobles">
      <label>Nombre<input required value={campos.nombre} onChange={cambiar("nombre")}/></label>
      <label>Apellido<input required value={campos.apellido} onChange={cambiar("apellido")}/></label>
      <label>Pasaporte<input required value={campos.documento} onChange={cambiar("documento")}/></label>
      <label>Nacimiento<input type="date" required value={campos.nacimiento} onChange={cambiar("nacimiento")}/></label>
      <label>Nacionalidad<input required value={campos.nacionalidad} onChange={cambiar("nacionalidad")}/></label>
    </div>
    <div className="acciones">
      <button type="submit" className="boton primario">{accion}</button>
      {cancelar && <button type="button" className="boton" onClick={cancelar}>Cancelar</button>}
    </div>
  </form>;
}

export function PanelPasajeros({ usuario, generacion }: { usuario: Usuario; generacion: string }) {
  const [editando, setEditando] = useState<string | null>(null);

  function guardar(pasajero: Pasajero) {
    if (guardarPasajero(usuario.email, pasajero, generacion)) setEditando(null);
  }

  return <section className="panel" aria-labelledby="titulo-pasajeros">
    <p className="micro acento">PASAJEROS FRECUENTES</p><h2 id="titulo-pasajeros">Quiénes viajan con vos</h2>
    <ul className="lista-pasajeros">
      {viajeros(usuario).map(pasajero => <li key={pasajero.id}>
        {editando === pasajero.id ? <FormPasajero inicial={pasajero} accion="Guardar pasajero" guardar={guardar} cancelar={() => setEditando(null)}/> : <>
          <div><strong>{nombreCompleto(pasajero)}</strong>{pasajero.id === "titular" && <> <Etiqueta tono="ok">Titular</Etiqueta></>}
            <p>Pasaporte {pasajero.documento} · {fechaCompleta(pasajero.nacimiento)} · {pasajero.nacionalidad}</p></div>
          {pasajero.id !== "titular" && <div className="fila-acciones">
            <button type="button" className="enlace" onClick={() => setEditando(pasajero.id)}>Editar</button>
            <button type="button" className="enlace" onClick={() => quitarPasajero(usuario.email, pasajero.id, generacion)}>Quitar</button>
          </div>}
        </>}
      </li>)}
    </ul>
    {editando === "nuevo" ? <div className="mt-3"><FormPasajero accion="Agregar pasajero" guardar={guardar} cancelar={() => setEditando(null)}/></div>
      : <button type="button" className="boton mt-3" onClick={() => setEditando("nuevo")}>Agregar pasajero</button>}
  </section>;
}

export function PantallaPasajeros({ id }: { id?: string }) {
  const { datos, listo } = useDatos();
  const router = useRouter();
  const [elecciones, setElecciones] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const reserva = datos.reservas[id ?? datos.borrador?.id ?? ""];
  if (!reserva) return <SinDatos listo={listo} mensaje="No encontramos una cotización validada en este navegador." />;
  if (reserva.estado !== "validada" && reserva.estado !== "pago_autorizado") return <main id="contenido" className="marco interior">
    <h1>{reserva.estado === "cotizada" ? "Primero, validá tu cotización." : "La reserva ya fue procesada."}</h1>
    <Link className="boton primario" href={reserva.estado === "cotizada" ? "/cotizacion" : "/reserva/" + reserva.id}>Continuar</Link>
  </main>;

  const { busqueda, precios, vence } = reserva.oferta.cotizacion;
  const destino = destinos[codigoDestino(busqueda)];
  const usuario = usuarioActual(datos);
  const volver = encodeURIComponent("/pasajeros?id=" + reserva.id);
  const encabezado = <>
    <Pasos actual={2}/>
    <div className="titulo-fila"><div><p className="micro acento">PASAJEROS / {reserva.id}</p><h1>¿Quiénes viajan?</h1></div><Vigencia hasta={vence}/></div>
    <p className="bajada">De {origenes[busqueda.origen]} a {destino.nombre} · {fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)} · {cantidadViajeros(busqueda.pasajeros)}</p>
  </>;

  if (!usuario) return <main id="contenido" className="marco interior">
    {encabezado}
    <section className="panel acceso-aviso"><p className="micro acento">CUENTA REQUERIDA</p><h2>Ingresá para cargar a los pasajeros</h2>
      <p className="mt-2">Necesitamos los datos de cada viajero para solicitar el vuelo, el hotel y la asistencia.</p>
      <div className="acciones"><Link href={"/ingresar?volver=" + volver} className="boton primario">Ingresar</Link><Link href={"/registro?volver=" + volver} className="boton">Crear cuenta</Link></div>
    </section>
    <ChatFlotante id={reserva.id}/>
  </main>;

  const disponibles = viajeros(usuario);
  const posiciones = Array.from({ length: busqueda.pasajeros }, (_, i) => i);
  const elegido = (i: number) => elecciones[i] ?? reserva.pasajeros?.[i]?.id ?? disponibles[i]?.id ?? "";

  function continuar() {
    const asignados = posiciones.map(i => disponibles.find(item => item.id === elegido(i)));
    const ids = new Set(asignados.map(item => item?.id));
    if (asignados.some(item => !item)) { setError("Asigná una persona a cada lugar de la reserva."); return; }
    if (ids.size !== asignados.length) { setError("Cada lugar tiene que tener un pasajero distinto."); return; }
    const pasajeros = asignados as Pasajero[];
    const actualizada = registrar({ ...reserva, titular: usuario!.email, pasajeros }, "Se asignaron " + pasajeros.length + " pasajeros a la reserva.", new Date().toISOString());
    if (guardarReserva(actualizada, datos.generacion)) router.push("/pago?id=" + reserva.id);
  }

  return <main id="contenido" className="marco interior">
    {encabezado}
    <div className="distribucion">
      <div className="pila">
        <section className="panel" aria-labelledby="titulo-asignar">
          <p className="micro acento">DATOS PARA LA RESERVA</p><h2 id="titulo-asignar">Asigná los lugares</h2>
          <div className="formulario">
            {posiciones.map(i => <label key={i}>Pasajero {i + 1}{i === 0 ? " · referente de la reserva" : ""}
              <select value={elegido(i)} onChange={e => { setElecciones({ ...elecciones, [i]: e.target.value }); setError(""); }}>
                <option value="">Elegí un pasajero</option>
                {disponibles.map(item => <option key={item.id} value={item.id}>{nombreCompleto(item)} · {item.documento}</option>)}
              </select>
            </label>)}
          </div>
          {error && <p role="alert" className="error">{error}</p>}
        </section>
        <section className="panel" aria-labelledby="titulo-nuevo-pasajero">
          <p className="micro acento">¿VIAJA ALGUIEN MÁS?</p><h2 id="titulo-nuevo-pasajero">Sumar un pasajero</h2>
          <FormPasajero accion="Guardar pasajero" guardar={pasajero => guardarPasajero(usuario.email, pasajero, datos.generacion)}/>
        </section>
      </div>
      <aside className="resumen">
        <p className="micro acento">TITULAR DE LA CUENTA</p><h2>{nombreCompleto(usuario)}</h2>
        <p className="nota">{usuario.email}<br/>{usuario.telefono}</p>
        <div className="total"><span>Total de la reserva</span><strong>{usd(precios.total)}</strong></div>
        <button type="button" className="boton primario w-full" onClick={continuar}>Continuar al pago</button>
        <Link href="/perfil" className="enlace mt-2 block">Administrar mis pasajeros</Link>
      </aside>
    </div>
    <ChatFlotante id={reserva.id}/>
  </main>;
}
