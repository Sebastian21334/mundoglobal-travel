"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { destinos } from "@/lib/datos/destinos";
import { destinoSeguro } from "@/lib/cuenta";
import type { Usuario } from "@/lib/dominio";
import { actualizar, useDatos } from "@/lib/storage";

function MarcoAcceso({ rotulo, titulo, bajada, children }: { rotulo: string; titulo: string; bajada: string; children: ReactNode }) {
  return <main id="contenido" className="marco interior">
    <div className="acceso-grid">
      <div>
        <p className="micro acento">{rotulo}</p><h1>{titulo}</h1><p className="bajada">{bajada}</p>
        <Image src={destinos.AUA.foto.src} alt={destinos.AUA.foto.alt} width={960} height={640} sizes="(max-width: 850px) 92vw, 620px" className="acceso-foto"/>
      </div>
      <section className="panel">{children}</section>
    </div>
  </main>;
}

const consulta = (volver?: string) => volver ? "?volver=" + encodeURIComponent(destinoSeguro(volver)) : "";

export function Ingreso({ volver }: { volver?: string }) {
  const router = useRouter();
  const { datos } = useDatos();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const registrada = Object.keys(datos.cuentas)[0];

  function enviar(event: FormEvent) {
    event.preventDefault();
    const correo = email.trim().toLowerCase();
    if (!datos.cuentas[correo]) { setError("No encontramos una cuenta con ese correo en este navegador. Creá una para continuar."); return; }
    if (actualizar(d => ({ ...d, sesion: correo }), datos.generacion)) router.push(destinoSeguro(volver));
  }

  return <MarcoAcceso rotulo="MI CUENTA / ACCESO" titulo="Ingresá a tu cuenta" bajada="Seguí tus reservas, guardá a tus pasajeros y hablá con Soporte Digital desde un solo lugar.">
    <p className="micro acento">INICIAR SESIÓN</p><h2>Tus datos de acceso</h2>
    <form className="formulario" onSubmit={enviar}>
      <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e => { setEmail(e.target.value); setError(""); }}/></label>
      <label>Contraseña<input type="password" autoComplete="current-password" required value={clave} onChange={e => setClave(e.target.value)}/></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" className="boton primario">Ingresar</button>
    </form>
    {registrada && <button type="button" className="enlace mt-3" onClick={() => { setEmail(registrada); setClave("demostracion"); setError(""); }}>Completar con la cuenta guardada</button>}
    <p className="nota mt-3">¿Todavía no tenés cuenta? <Link href={"/registro" + consulta(volver)} className="enlace">Registrate</Link></p>
    <p className="nota">Acceso simulado. Se valida el correo registrado en este navegador y la contraseña no se guarda.</p>
  </MarcoAcceso>;
}

const camposVacios = { nombre: "", apellido: "", email: "", telefono: "", documento: "", nacimiento: "", nacionalidad: "Argentina" };

export function Registro({ volver }: { volver?: string }) {
  const router = useRouter();
  const { datos } = useDatos();
  const [campos, setCampos] = useState(camposVacios);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const cambiar = (nombre: keyof typeof camposVacios) => (event: { target: { value: string } }) => setCampos({ ...campos, [nombre]: event.target.value });

  function enviar(event: FormEvent) {
    event.preventDefault();
    const email = campos.email.trim().toLowerCase();
    if (datos.cuentas[email]) { setError("Ya existe una cuenta con ese correo. Ingresá con tus datos."); return; }
    const usuario: Usuario = { ...campos, email, pasajeros: [] };
    if (actualizar(d => ({ ...d, cuentas: { ...d.cuentas, [email]: usuario }, sesion: email }), datos.generacion)) router.push(destinoSeguro(volver));
  }

  return <MarcoAcceso rotulo="MI CUENTA / REGISTRO" titulo="Creá tu cuenta" bajada="Tus datos quedan listos para reservar. Quien se registra figura como titular y puede sumar a sus pasajeros frecuentes.">
    <p className="micro acento">DATOS DEL TITULAR</p><h2>Registrate</h2>
    <form className="formulario" onSubmit={enviar}>
      <div className="campos-dobles">
        <label>Nombre<input required autoComplete="given-name" value={campos.nombre} onChange={cambiar("nombre")}/></label>
        <label>Apellido<input required autoComplete="family-name" value={campos.apellido} onChange={cambiar("apellido")}/></label>
        <label>Pasaporte<input required value={campos.documento} onChange={cambiar("documento")}/></label>
        <label>Nacimiento<input type="date" required value={campos.nacimiento} onChange={cambiar("nacimiento")}/></label>
        <label>Nacionalidad<input required value={campos.nacionalidad} onChange={cambiar("nacionalidad")}/></label>
        <label>Teléfono<input type="tel" required autoComplete="tel" value={campos.telefono} onChange={cambiar("telefono")}/></label>
      </div>
      <label>Correo electrónico<input type="email" required autoComplete="email" value={campos.email} onChange={e => { cambiar("email")(e); setError(""); }}/></label>
      <label>Contraseña<input type="password" required minLength={8} autoComplete="new-password" value={clave} onChange={e => setClave(e.target.value)}/></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" className="boton primario">Crear cuenta</button>
    </form>
    <p className="nota mt-3">¿Ya tenés cuenta? <Link href={"/ingresar" + consulta(volver)} className="enlace">Ingresá</Link></p>
    <p className="nota">Registro simulado. Los datos quedan en este navegador y la contraseña no se guarda.</p>
  </MarcoAcceso>;
}
