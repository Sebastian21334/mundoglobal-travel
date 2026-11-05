import { Buscador } from "@/components/buscador";
import { Mapa } from "@/components/mapa";

export default function Home() {
  return <main id="contenido" className="marco inicio">
    <div className="linea-edicion"><span>GUÍA DE RESERVA / CARIBE</span><span>REPÚBLICA DOMINICANA · PUJ</span></div>
    <section className="portada">
      <div className="portada-texto">
        <p className="micro acento">RUTA 01 · PUNTA CANA</p>
        <h1>Próxima parada,<br/><em>Punta Cana.</em></h1>
        <p className="bajada">Elegí tu vuelo, un hotel All Inclusive y la asistencia que necesitás. Revisá el precio completo y reservá los tres servicios en un solo paso de pago.</p>
        <div className="puertas"><span><b>EZE</b> Vuelo directo</span><span><b>COR</b> Una escala</span></div>
      </div>
      <figure className="portada-mapa"><Mapa /><figcaption><span>FIG. 01</span><span>ESQUEMA DE RUTAS DEL PILOTO</span></figcaption></figure>
    </section>
    <Buscador />
    <section className="regla-abajo" aria-label="Qué incluye el paquete">
      <div><span className="micro">01 / VUELO</span><p>Compará horarios y equipaje.</p></div>
      <div><span className="micro">02 / ESTADÍA</span><p>De 5 a 14 noches All Inclusive.</p></div>
      <div><span className="micro">03 / ASISTENCIA</span><p>Consultá coberturas y topes en USD.</p></div>
    </section>
  </main>;
}
