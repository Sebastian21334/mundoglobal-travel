import Image from "next/image";
import { destinos, destinosDisponibles } from "@/lib/datos/destinos";
import type { Destino } from "@/lib/dominio";

export function Destinos({ seleccionado, elegir }: { seleccionado: Destino; elegir: (destino: Destino) => void }) {
  return <section className="destinos" aria-labelledby="titulo-destinos">
    <div className="destinos-cabecera"><div><p className="micro acento">CATÁLOGO DE PAQUETES</p><h2 id="titulo-destinos">Elegí dónde aterrizar</h2></div>
      <p>Cuatro destinos para comparar vuelos, zonas de hotel y asistencia antes de reservar.</p>
    </div>
    <ul className="destinos-lista">
      {destinosDisponibles.map(codigo => {
        const destino = destinos[codigo];
        return <li key={codigo}>
          <Image src={destino.foto.src} alt={destino.foto.alt} width={960} height={640} sizes="(max-width: 390px) 92vw, (max-width: 850px) 46vw, (max-width: 1314px) 23vw, 300px" className="destino-foto"/>
          <div className="destino-ficha">
            <p className="micro acento">{destino.rotulo} / {codigo}</p>
            <h3>{destino.nombre}</h3>
            <p><strong>{destino.zona}.</strong> {destino.descripcion}</p>
            <button type="button" className="boton" aria-pressed={seleccionado === codigo}
              aria-label={"Elegir " + destino.nombre} onClick={() => elegir(codigo)}>
              {seleccionado === codigo ? "Destino seleccionado" : "Elegir destino"} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
