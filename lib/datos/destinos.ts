import type { Busqueda, Destino } from "../dominio";

export const destinos = {
  PUJ: { nombre: "Punta Cana", pais: "República Dominicana", aeropuerto: "Punta Cana", zona: "Bávaro y Cap Cana", descripcion: "Resorts entre palmeras, playa abierta y estadías frente al Caribe.", rotulo: "COSTA ESTE" },
  CUN: { nombre: "Cancún", pais: "México", aeropuerto: "Cancún", zona: "Zona Hotelera y Riviera Maya", descripcion: "Elegí entre la franja hotelera, Costa Mujeres y la costa de la Riviera Maya.", rotulo: "CARIBE MEXICANO" },
  AUA: { nombre: "Aruba", pais: "Aruba", aeropuerto: "Oranjestad", zona: "Eagle Beach y Palm Beach", descripcion: "Una isla para combinar playa, hoteles de baja altura y paseos por Oranjestad.", rotulo: "CARIBE SUR" },
  REC: { nombre: "Porto de Galinhas", pais: "Brasil", aeropuerto: "Recife", zona: "Muro Alto, Cupe y Maracaípe", descripcion: "Una estadía de playa en Pernambuco, con llegada por el aeropuerto de Recife.", rotulo: "NORDESTE BRASILEÑO" },
} satisfies Record<Destino, { nombre: string; pais: string; aeropuerto: string; zona: string; descripcion: string; rotulo: string }>;

export const destinosDisponibles = Object.keys(destinos) as Destino[];
export const esDestino = (valor: unknown): valor is Destino =>
  typeof valor === "string" && Object.hasOwn(destinos, valor);

// Las reservas y cotizaciones emitidas antes de incorporar el catálogo corresponden a Punta Cana.
export const codigoDestino = ({ destino }: Pick<Busqueda, "destino">): Destino => destino ?? "PUJ";
