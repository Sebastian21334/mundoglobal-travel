import Link from "next/link";

export function Marca() {
  return <svg viewBox="0 0 244 47" className="logo" role="img" aria-label="MundoGlobal Travel">
    <path d="M0 14h35M0 28h20m-4-7h18m-9-13 12 12-12 12" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <text x="44" y="26" fontSize="27" className="marca-tipo" fill="currentColor">MundoGlobal</text>
    <text x="46" y="42" fontSize="8" letterSpacing="5" fill="currentColor">TRAVEL</text>
  </svg>;
}

export function Cabecera() {
  return <header className="cabecera">
    <div className="marco cabecera-fila">
      <Link href="/" aria-label="MundoGlobal Travel, inicio"><Marca /></Link>
      <nav aria-label="Principal" className="nav-sitio">
        <Link href="/mis-viajes">Mis viajes</Link><Link href="/soporte">Soporte digital <span aria-hidden="true">↗</span></Link>
      </nav>
    </div>
  </header>;
}
