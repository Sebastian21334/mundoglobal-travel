"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { escenarios, type Escenario } from "@/lib/dominio";
import { cargarDatosDemo } from "@/lib/operacion";
import { actualizar, useDatos } from "@/lib/storage";

export function BotonDatosDemo() {
  const [estado, setEstado] = useState<"" | "cargando" | "listo" | "error">("");

  async function cargar() {
    setEstado("cargando");
    try {
      setEstado(await cargarDatosDemo() ? "listo" : "error");
    } catch {
      setEstado("error");
    }
  }

  return <button type="button" className="boton" disabled={estado === "cargando"} onClick={cargar}>
    {estado === "cargando" ? "Cargando…" : estado === "listo" ? "Datos de ejemplo cargados ✓" : estado === "error" ? "No se pudo cargar. Reintentar" : "Cargar datos de ejemplo"}
  </button>;
}

export function Pie() {
  const [abierto, setAbierto] = useState(false);
  const { datos } = useDatos();
  const modo = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const tecla = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === "KeyD") {
        event.preventDefault();
        setAbierto(actual => !actual);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
  useEffect(() => { if (abierto) modo.current?.focus(); }, [abierto]);

  return <footer className="pie print:hidden">
    <div className="marco">
      <div className="pie-fila">
        <p>Prototipo académico. Datos y proveedores simulados. UTN FRVM, TPI 2026, Grupo R</p>
        <Link href="/creditos-fotos" className="enlace">Créditos de fotos</Link>
        <button className="enlace" type="button" aria-expanded={abierto} aria-controls="panel-demo" onClick={() => setAbierto(!abierto)}>
          Modo demostración <span aria-hidden="true">{abierto ? "−" : "+"}</span>
        </button>
      </div>
      {abierto && <section id="panel-demo" className="demo" aria-label="Modo demostración">
        <label>Escenario de la próxima operación
          <select ref={modo} value={datos.escenario} onChange={event => {
            const escenario = event.target.value as Escenario;
            actualizar(previo => ({ ...previo, escenario }));
          }}>
            {Object.entries(escenarios).map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
          </select>
        </label>
        <div><p>Elegí el escenario antes de validar. Para recuperar una reserva en revisión, usá «Reintentar». Atajo <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>.</p>
          <div className="acciones"><BotonDatosDemo/></div></div>
      </section>}
    </div>
  </footer>;
}
