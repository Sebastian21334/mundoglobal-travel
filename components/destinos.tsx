import { destinos, destinosDisponibles } from "@/lib/datos/destinos";
import type { Destino } from "@/lib/dominio";

function Arte({ codigo }: { codigo: Destino }) {
  const [cielo, sol, mar, sombra] = {
    PUJ: ["#e4cc9e","#d98e64","#4d8274","#163f3b"],
    CUN: ["#d8e0bd","#f1d89e","#388b88","#255e64"],
    AUA: ["#ebccae","#bf6954","#547f87","#274751"],
    REC: ["#e9d5a1","#e2a755","#69927d","#355950"],
  }[codigo];
  return <svg viewBox="0 0 330 156" aria-hidden="true" className="destino-arte">
    <rect width="330" height="156" fill={cielo}/>
    <circle cx={codigo === "AUA" ? 108 : 240} cy="56" r="33" fill={sol}/>
    <path d="M0 84 Q55 73 112 86 T224 84 T330 76 V156 H0Z" fill={mar}/>
    <path d="M0 121Q73 101 134 127T255 128T330 116V156H0Z" fill={sombra}/>
    <path d="M15 111q52-12 92 0m58 7q56 12 104-3m-77 24q49 7 100-6" fill="none" stroke={cielo} strokeWidth="1.3" opacity=".62"/>
    {codigo === "PUJ" && <path d="M45 145q17-49 26-87m0 0Q43 41 21 65q31-8 50-7m0 0Q65 29 43 25q19 19 28 33m0 0Q83 29 118 36q-26 8-47 22m0 0q28-9 49 11-27-8-49-11" stroke={sombra} strokeWidth="4" fill="none" strokeLinecap="round"/>}
    {codigo === "CUN" && <g fill={sombra}><path d="M0 83h119l28 8H0Z"/><path d="M22 81V54h15v27m6 0V46h19v35m6 0V59h16v22m7 0V51h16v30"/><path d="M252 101l19-9 16 9-16 6z"/></g>}
    {codigo === "AUA" && <path d="M242 145q9-34 27-64m-9 15q-12-11-29-10m39-5q-3-18-16-28m16 28q9-22 37-23m-38 26q17-10 44 0" fill="none" stroke={sombra} strokeWidth="5" strokeLinecap="round"/>}
    {codigo === "REC" && <g fill={sombra}><path d="M0 88l20-11 29-1 20-12 27 6 27 18z"/><path d="M209 104l19-8 22 3 15 9-17 5-24-2zM270 122l14-7 20 3 11 8-14 5-22-4z"/><path d="M111 95l8-18 8 18z"/></g>}
    <path d="M12 14h35m-35 0v18m306-18h-35m35 0v18m0 110h-35m35 0v-18m-306 18h35m-35 0v-18" fill="none" stroke={sombra} strokeOpacity=".45"/>
  </svg>;
}

export function Destinos({ seleccionado, elegir }: { seleccionado: Destino; elegir: (destino: Destino) => void }) {
  return <section className="destinos" aria-labelledby="titulo-destinos">
    <div className="destinos-cabecera"><div><p className="micro acento">CATÁLOGO DE PAQUETES</p><h2 id="titulo-destinos">Elegí dónde aterrizar</h2></div>
      <p>Cuatro destinos para comparar vuelos, zonas de hotel y asistencia antes de reservar.</p>
    </div>
    <ul className="destinos-lista">
      {destinosDisponibles.map(codigo => {
        const destino = destinos[codigo];
        return <li key={codigo}>
          <Arte codigo={codigo}/>
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
