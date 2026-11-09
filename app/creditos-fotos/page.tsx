import type { Metadata } from "next";

export const metadata: Metadata = { title: "Créditos de fotos" };

const wikimedia = [
  { nombre: "Playa Bávaro, Punta Cana", autor: "Andreas Volkmer", archivo: "Playa_Bavaro.JPG", licencia: "CC BY 2.5", enlace: "by/2.5" },
  { nombre: "Playa Gaviota Azul y zona hotelera de Cancún", autor: "ProtoplasmaKid", archivo: "Cancún_-_Playa_Gaviota_Azul_-_05.jpg", licencia: "CC BY-SA 4.0", enlace: "by-sa/4.0" },
  { nombre: "Árbol divi-divi de Eagle Beach, Aruba", autor: "DDJJ", archivo: "Divi_divi_tree_Eagle_Beach.jpg", licencia: "CC BY-SA 4.0", enlace: "by-sa/4.0" },
  { nombre: "Hotel de referencia para Palma Serena Aruba", autor: "Caribiana", archivo: "Riu_Aruba_Resort.jpeg", licencia: "CC BY-SA 4.0", enlace: "by-sa/4.0" },
];

const pexels = [
  ["Porto de Galinhas", "aerial-view-of-porto-de-galinhas-beachfront-36229677"],
  ["Casa Arena Bávaro", "tropical-beachfront-resort-in-dominican-republic-36569679"],
  ["Los Manglares de Macao", "coconut-trees-around-a-swimming-pool-2646070"],
  ["Bahía Coral Cap Cana", "a-large-pool-and-lawn-area-with-palm-trees-27868502"],
  ["Costa del Sol Cancún", "tropical-resort-pool-with-palm-trees-and-umbrellas-34640997"],
  ["Laguna Clara Resort", "tropical-resort-on-the-coast-12004337"],
  ["Jade Azul Riviera", "modern-tropical-resort-facade-with-poolside-hammock-37564585"],
  ["Dunas de Eagle Resort", "sun-loungers-on-the-beach-in-front-of-the-resort-19254159"],
  ["Sal de Mar Resort", "aerial-photography-of-beach-resort-with-swimming-pool-10571080"],
  ["Maré Mansa Resort", "tropical-poolside-at-luxury-hotel-in-brazil-37459523"],
  ["Areia Clara Muro Alto", "aerial-view-of-tropical-resort-with-swimming-pools-34054922"],
  ["Recife de Luz Resort", "vista-aerea-do-resort-tropical-com-piscina-e-praia-33191052"],
  ["Vuelo", "aerial-photography-of-airplane-wing-over-clouds-1381414"],
  ["Asistencia al viajero", "first-aid-kit-on-white-background-5664736"],
];

export default function CreditosFotos() {
  return <main id="contenido" className="marco interior">
    <h1>Créditos de fotos</h1>
    <p className="bajada">Las fotos de hoteles son de referencia para el catálogo simulado. Las imágenes se recortaron y optimizaron para la web.</p>
    <section className="panel">
      <h2>Wikimedia Commons</h2>
      <ul className="lista-documentos mt-3">
        {wikimedia.map(({ nombre, autor, archivo, licencia, enlace }) => <li key={archivo}>
          <a href={"https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(archivo)}>{nombre}</a>
          <p className="nota">{autor} · Wikimedia Commons · <a href={"https://creativecommons.org/licenses/" + enlace + "/"} className="underline">{licencia}</a></p>
        </li>)}
      </ul>
      <h2 className="mt-6">Pexels</h2>
      <p className="nota mt-2"><a href="https://www.pexels.com/legal-pages/license/" className="underline">Licencia de Pexels</a></p>
      <ul className="lista-documentos mt-3">
        {pexels.map(([nombre, slug]) => <li key={slug}>
          <a href={`https://www.pexels.com/photo/${slug}/`}>{nombre}</a>
        </li>)}
      </ul>
    </section>
  </main>;
}
