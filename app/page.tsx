import { Buscador } from "@/components/buscador";
import { Mapa } from "@/components/mapa";

export default function Home() {
  return <main id="contenido" className="marco inicio">
    <div className="linea-edicion"><span>GUÍA DE RESERVA / CARIBE Y BRASIL</span><span>CUATRO DESTINOS · DOS CIUDADES DE SALIDA</span></div>
    <section className="portada">
      <div className="portada-texto">
        <p className="micro acento">PAQUETES DE PLAYA / TEMPORADA ABIERTA</p>
        <h1>Próxima parada,<br/><em>la costa.</em></h1>
        <p className="bajada">De Cancún a Porto de Galinhas, armá tu viaje con vuelo, hotel All Inclusive y asistencia. Compará las opciones y revisá el precio total antes de reservar.</p>
        <div className="puertas"><span><b>EZE</b> Buenos Aires</span><span><b>COR</b> Córdoba</span></div>
      </div>
      <figure className="portada-mapa"><Mapa /><figcaption><span>FIG. 01</span><span>ESQUEMA DE DESTINOS</span></figcaption></figure>
    </section>
    <Buscador />
    <section className="regla-abajo" aria-label="Qué incluye el paquete">
      <div><span className="micro">01 / VUELO</span><p>Compará horarios, escalas y equipaje.</p></div>
      <div><span className="micro">02 / ESTADÍA</span><p>De 5 a 14 noches All Inclusive.</p></div>
      <div><span className="micro">03 / ASISTENCIA</span><p>Consultá coberturas y topes en USD.</p></div>
    </section>
  </main>;
}
