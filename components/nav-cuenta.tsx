"use client";
import Link from "next/link";
import { usuarioActual } from "@/lib/cuenta";
import { useDatos } from "@/lib/storage";

export function NavCuenta() {
  const { datos } = useDatos();
  const usuario = usuarioActual(datos);
  const sinLeer = datos.avisos.filter(aviso => !aviso.leido).length;
  return <>
    <Link href="/notificaciones" className="nav-avisos" aria-label={"Notificaciones" + (sinLeer ? ", " + sinLeer + " sin leer" : "")}>
      <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2.5a5 5 0 0 0-5 5c0 4.5-1.8 6-1.8 6h13.6S15 12 15 7.5a5 5 0 0 0-5-5ZM8.3 16.5a1.8 1.8 0 0 0 3.4 0"/></svg>
      <b className="nav-avisos-texto">Avisos</b>
      {sinLeer > 0 && <b className="insignia">{sinLeer}</b>}
    </Link>
    <Link href={usuario ? "/perfil" : "/ingresar"} className="nav-perfil">{usuario ? usuario.nombre : "Ingresar"}</Link>
  </>;
}
