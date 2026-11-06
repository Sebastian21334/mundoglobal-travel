import Link from "next/link";

export default function NoEncontrado() {
  return <main id="contenido" className="marco interior">
    <p className="micro acento">PÁGINA NO ENCONTRADA</p><h1>Ese enlace no está disponible.</h1>
    <p className="bajada">Volvé al inicio o consultá tus reservas guardadas en Mis viajes.</p>
    <div className="acciones"><Link href="/" className="boton primario">Volver al inicio</Link><Link href="/mis-viajes" className="boton">Mis viajes</Link></div>
  </main>;
}
