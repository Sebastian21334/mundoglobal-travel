import Image from "next/image";
import { Buscador } from "@/components/buscador";
import { Mapa } from "@/components/mapa";
import { destinos } from "@/lib/datos/destinos";

export default function Home() {
  return <main id="contenido" className="marco inicio">
    <section className="portada">
      <div className="portada-texto">
        <p className="micro acento">PAQUETES DE PLAYA / TEMPORADA ABIERTA</p>
        <h1>Próxima parada,<br/><em>la costa.</em></h1>
        <p className="bajada">De Cancún a Porto de Galinhas, armá tu viaje con vuelo, hotel All Inclusive y asistencia. Compará las opciones y revisá el precio total antes de reservar.</p>
        <div className="puertas"><span><b>EZE</b> Buenos Aires</span><span><b>COR</b> Córdoba</span></div>
      </div>
      <div className="portada-visual">
        <figure>
          <Image src={destinos.PUJ.foto.src} alt={destinos.PUJ.foto.alt} width={1280} height={854} sizes="(max-width: 640px) 94vw, (max-width: 1314px) 44vw, 550px" className="portada-foto" preload/>
          <figcaption><span>FIG. 01</span><span>PLAYA BÁVARO · PUNTA CANA</span></figcaption>
        </figure>
        <details className="portada-mapa"><summary>Ver mapa de destinos</summary><Mapa /></details>
      </div>
    </section>
    <Buscador />
    <section className="regla-abajo" aria-label="Qué incluye el paquete">
      <div><Image src="/fotos/vuelo.webp" alt="" width={640} height={427} sizes="(max-width: 640px) 92vw, (max-width: 1314px) 32vw, 405px" className="servicio-foto"/><span className="micro">01 / VUELO</span><p>Compará horarios, escalas y equipaje.</p></div>
      <div><Image src="/fotos/hoteles/arena.webp" alt="" width={640} height={427} sizes="(max-width: 640px) 92vw, (max-width: 1314px) 32vw, 405px" className="servicio-foto"/><span className="micro">02 / ESTADÍA</span><p>De 5 a 14 noches All Inclusive.</p></div>
      <div><Image src="/fotos/asistencia.webp" alt="" width={640} height={427} sizes="(max-width: 640px) 92vw, (max-width: 1314px) 32vw, 405px" className="servicio-foto"/><span className="micro">03 / ASISTENCIA</span><p>Consultá coberturas y topes en USD.</p></div>
    </section>
  </main>;
}
