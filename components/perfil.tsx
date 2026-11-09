"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { usuarioActual } from "@/lib/cuenta";
import { escenarios, type Usuario } from "@/lib/dominio";
import { actualizar, restablecerDemo, useDatos } from "@/lib/storage";
import { BotonDatosDemo } from "./demo";
import { PanelPasajeros } from "./pasajeros";

function DatosPersonales({ usuario, generacion }: { usuario: Usuario; generacion: string }) {
  const [campos, setCampos] = useState(usuario);
  const [mensaje, setMensaje] = useState("");
  const cambiar = (nombre: keyof Omit<Usuario, "pasajeros" | "email">) => (event: { target: { value: string } }) => { setCampos({ ...campos, [nombre]: event.target.value }); setMensaje(""); };

  function guardar(event: FormEvent) {
    event.preventDefault();
    if (actualizar(d => ({ ...d, cuentas: { ...d.cuentas, [usuario.email]: { ...d.cuentas[usuario.email], ...campos, pasajeros: d.cuentas[usuario.email].pasajeros } } }), generacion)) setMensaje("Guardamos tus datos.");
  }

  return <section className="panel" aria-labelledby="titulo-datos">
    <p className="micro acento">TITULAR DE LA CUENTA</p><h2 id="titulo-datos">Datos personales</h2>
    <form className="formulario" onSubmit={guardar}>
      <div className="campos-dobles">
        <label>Nombre<input required value={campos.nombre} onChange={cambiar("nombre")}/></label>
        <label>Apellido<input required value={campos.apellido} onChange={cambiar("apellido")}/></label>
        <label>Pasaporte<input required value={campos.documento} onChange={cambiar("documento")}/></label>
        <label>Nacimiento<input type="date" required value={campos.nacimiento} onChange={cambiar("nacimiento")}/></label>
        <label>Nacionalidad<input required value={campos.nacionalidad} onChange={cambiar("nacionalidad")}/></label>
        <label>Teléfono<input type="tel" required value={campos.telefono} onChange={cambiar("telefono")}/></label>
      </div>
      <label>Correo electrónico<input type="email" value={campos.email} readOnly/></label>
      <button type="submit" className="boton primario">Guardar datos</button>
      <p className="nota" role="status">{mensaje}</p>
    </form>
  </section>;
}

export function Perfil() {
  const { datos, listo } = useDatos();
  const confirmacion = useRef<HTMLDialogElement>(null);
  const [mensaje, setMensaje] = useState("");
  const usuario = usuarioActual(datos);
  const reservas = Object.values(datos.reservas);
  const viajes = reservas.filter(reserva => reserva.estado !== "cotizada").length;
  const casos = Object.keys(datos.casos).length;
  const chats = Object.keys(datos.chats).length;

  function borrar() {
    const completo = restablecerDemo();
    confirmacion.current?.close();
    setMensaje(completo ? "Demo restablecida. Ya podés empezar una nueva cotización."
      : "Se limpió la sesión actual. El navegador bloqueó el acceso a los datos persistentes.");
  }

  return <main id="contenido" className="marco interior perfil">
    <div className="titulo-fila"><div><p className="micro acento">MI CUENTA / {usuario ? usuario.email : "SIN SESIÓN"}</p><h1>Mi perfil</h1></div>
      {usuario && <button type="button" className="boton" onClick={() => actualizar(d => ({ ...d, sesion: undefined }), datos.generacion)}>Cerrar sesión</button>}
    </div>
    <p className="bajada">Administrá tus datos personales y la información de los pasajeros necesaria para reservar.</p>
    {listo && !usuario && <section className="panel acceso-aviso mb-5"><p className="micro acento">CUENTA</p><h2>Ingresá para ver tus datos</h2>
      <p className="mt-2">Con tu cuenta guardás los datos del titular y de los pasajeros frecuentes.</p>
      <div className="acciones"><Link href="/ingresar" className="boton primario">Ingresar</Link><Link href="/registro" className="boton">Crear cuenta</Link></div>
    </section>}
    {usuario && <div className="perfil-grid perfil-cuenta">
      <DatosPersonales key={usuario.email} usuario={usuario} generacion={datos.generacion}/>
      <PanelPasajeros usuario={usuario} generacion={datos.generacion}/>
    </div>}
    <div className="perfil-grid">
      <section className="panel" aria-labelledby="datos-demo">
        <p className="micro acento">ESTADO LOCAL</p><h2 id="datos-demo">Tu actividad</h2>
        <dl className="desglose">
          <div><dt>Cotizaciones</dt><dd>{listo ? reservas.length - viajes : "…"}</dd></div>
          <div><dt>Reservas</dt><dd>{listo ? viajes : "…"}</dd></div>
          <div><dt>Casos de soporte</dt><dd>{listo ? casos : "…"}</dd></div>
          <div><dt>Conversaciones</dt><dd>{listo ? chats : "…"}</dd></div>
          <div><dt>Escenario activo</dt><dd>{listo ? escenarios[datos.escenario] : "…"}</dd></div>
        </dl>
        <Link href="/mis-viajes" className="boton">Ir a Mis viajes</Link>
      </section>
      <section className="panel reinicio" aria-labelledby="reiniciar-demo">
        <p className="micro acento">DATOS DE LA DEMO</p><h2 id="reiniciar-demo">Datos de la demostración</h2>
        <p>Cargá una cuenta con viajes, casos y avisos de ejemplo para recorrer todas las pantallas, o eliminá todo lo guardado en este navegador.</p>
        <div className="acciones"><BotonDatosDemo/><button type="button" className="boton primario" disabled={!listo}
          onClick={() => { setMensaje(""); confirmacion.current?.showModal(); }}>Restablecer demo</button></div>
        <p className="perfil-resultado" role="status">{mensaje}</p>
        {mensaje && <Link className="enlace" href="/#buscador">Hacer una nueva cotización ↗</Link>}
      </section>
    </div>
    <dialog ref={confirmacion} className="dialogo-reinicio" aria-labelledby="titulo-reinicio" aria-describedby="detalle-reinicio">
      <p className="micro acento">CONFIRMAR ACCIÓN</p>
      <h2 id="titulo-reinicio">¿Restablecer la demo?</h2>
      <p id="detalle-reinicio">Se borrarán todos los datos locales de MundoGlobal Travel, incluidos las cuentas y los viajes emitidos. Esta acción es definitiva.</p>
      <div className="acciones">
        <form method="dialog"><button type="submit" className="boton" autoFocus>Cancelar</button></form>
        <button type="button" className="boton primario" onClick={borrar}>Borrar datos de la demo</button>
      </div>
    </dialog>
  </main>;
}
