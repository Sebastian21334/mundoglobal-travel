import type { Busqueda, Destino } from "../dominio";

export const destinos = {
  PUJ: { foto: { src: "/fotos/punta-cana.webp", alt: "Palmeras a orillas de Playa Bávaro, en Punta Cana" }, nombre: "Punta Cana", pais: "República Dominicana", aeropuerto: "Punta Cana", zona: "Bávaro y Cap Cana", descripcion: "Resorts entre palmeras, playa abierta y estadías frente al Caribe.", rotulo: "COSTA ESTE" },
  CUN: { foto: { src: "/fotos/cancun.webp", alt: "Vista aérea de la costa y la zona hotelera de Cancún" }, nombre: "Cancún", pais: "México", aeropuerto: "Cancún", zona: "Zona Hotelera y Riviera Maya", descripcion: "Elegí entre la franja hotelera, Costa Mujeres y la costa de la Riviera Maya.", rotulo: "CARIBE MEXICANO" },
  AUA: { foto: { src: "/fotos/aruba.webp", alt: "Árbol divi-divi frente al mar en Eagle Beach, Aruba" }, nombre: "Aruba", pais: "Aruba", aeropuerto: "Oranjestad", zona: "Eagle Beach y Palm Beach", descripcion: "Una isla para combinar playa, hoteles de baja altura y paseos por Oranjestad.", rotulo: "CARIBE SUR" },
  REC: { foto: { src: "/fotos/porto-de-galinhas.webp", alt: "Vista aérea de la costa de Porto de Galinhas, Pernambuco" }, nombre: "Porto de Galinhas", pais: "Brasil", aeropuerto: "Recife", zona: "Muro Alto, Cupe y Maracaípe", descripcion: "Una estadía de playa en Pernambuco, con llegada por el aeropuerto de Recife.", rotulo: "NORDESTE BRASILEÑO" },
} satisfies Record<Destino, { nombre: string; pais: string; aeropuerto: string; zona: string; descripcion: string; rotulo: string; foto: { src: string; alt: string } }>;

export const destinosDisponibles = Object.keys(destinos) as Destino[];
export const esDestino = (valor: unknown): valor is Destino =>
  typeof valor === "string" && Object.hasOwn(destinos, valor);

// Las reservas y cotizaciones emitidas antes de incorporar el catálogo corresponden a Punta Cana.
export const codigoDestino = ({ destino }: Pick<Busqueda, "destino">): Destino => destino ?? "PUJ";
