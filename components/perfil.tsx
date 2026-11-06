"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { escenarios } from "@/lib/dominio";
import { restablecerDemo, useDatos } from "@/lib/storage";

export function Perfil() {
  const { datos, listo } = useDatos();
  const confirmacion = useRef<HTMLDialogElement>(null);
  const [mensaje, setMensaje] = useState("");
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
    <p className="micro acento">MI CUENTA / SESIÓN DE DEMOSTRACIÓN</p>
    <h1>Mi perfil</h1>
    <p className="bajada">Administrá los datos de MundoGlobal Travel guardados en este navegador.</p>
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
        <p className="micro acento">DATOS DE LA DEMO</p><h2 id="reiniciar-demo">Empezar de cero</h2>
        <p>Eliminá las cotizaciones, reservas, casos y chats de MundoGlobal Travel en este navegador. El modo demostración vuelve al camino normal.</p>
        <div className="acciones"><button type="button" className="boton primario" disabled={!listo}
          onClick={() => { setMensaje(""); confirmacion.current?.showModal(); }}>Restablecer demo</button></div>
        <p className="perfil-resultado" role="status">{mensaje}</p>
        {mensaje && <Link className="enlace" href="/#buscador">Hacer una nueva cotización ↗</Link>}
      </section>
    </div>
    <dialog ref={confirmacion} className="dialogo-reinicio" aria-labelledby="titulo-reinicio" aria-describedby="detalle-reinicio">
      <p className="micro acento">CONFIRMAR ACCIÓN</p>
      <h2 id="titulo-reinicio">¿Restablecer la demo?</h2>
      <p id="detalle-reinicio">Se borrarán todos los datos locales de MundoGlobal Travel, incluidos los viajes emitidos. Esta acción es definitiva.</p>
      <div className="acciones">
        <form method="dialog"><button type="submit" className="boton" autoFocus>Cancelar</button></form>
        <button type="button" className="boton primario" onClick={borrar}>Borrar datos de la demo</button>
      </div>
    </dialog>
  </main>;
}
