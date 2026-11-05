import type { Asistencia, Catalogo, Hotel, Origen, Vuelo } from "../dominio";

export const origenes = { COR: "Córdoba", EZE: "Buenos Aires" };
const lineas = ["Austral del Sur", "Ala Caribe", "Latitud Atlántica"];
const horarios = {
  EZE: [["07:25","13:38","06 h 13"],["10:50","17:06","06 h 16"],["19:40","01:55 +1","06 h 15"]],
  COR: [["05:50","15:20","09 h 30"],["08:15","18:20","10 h 05"],["12:35","22:15","09 h 40"]],
};

export function vuelos(origen: Origen, ida: string): Vuelo[] {
  const ajuste = (Number(ida.slice(-2)) % 4) * 1500;
  return horarios[origen].map(([salida, llegada, duracion], i) => ({
    id: origen + "-" + (i + 1), linea: lineas[i], codigo: ["AS 406","AC 217","LA 542"][i],
    salida, llegada, duracion,
    escala: origen === "EZE" ? "Directo" : ["1 escala en Panamá", "1 escala en Lima", "1 escala en Bogotá"][i],
    equipaje: i === 0 ? "Cabina 10 kg + valija 23 kg" : i === 1 ? "Cabina 10 kg" : "Cabina 8 kg + valija 23 kg",
    precio: [52200, 46800, 58400][i] + ajuste + (origen === "COR" ? 3200 : 0),
  }));
}

export const hoteles: Hotel[] = [
  { id: "arena", nombre: "Casa Arena Bávaro", estrellas: 4, zona: "Bávaro", incluye: "Playa, buffet, bebidas de la casa y dos piscinas.", politica: "Cambios sujetos a cupo hasta 72 h antes del ingreso.", precio: 8900 },
  { id: "mangle", nombre: "Los Manglares de Macao", estrellas: 4, zona: "Playa Macao", incluye: "Buffet, dos cenas a la carta y actividades de playa.", politica: "Permite un cambio hasta 7 días antes del ingreso.", precio: 10400 },
  { id: "coral", nombre: "Bahía Coral Cap Cana", estrellas: 5, zona: "Cap Cana", incluye: "Restaurantes a la carta, bebidas premium y club de playa.", politica: "Cambios sujetos a diferencia de tarifa hasta 48 h antes.", precio: 14900 },
];

export const asistencias: Asistencia[] = [
  { id: "basica", nombre: "Básica", cobertura: 30000, incluye: "Urgencias médicas y teleconsulta 24 h.", precio: 490 },
  { id: "completa", nombre: "Completa", cobertura: 75000, incluye: "Urgencias, medicamentos y demora de equipaje.", precio: 760 },
  { id: "premium", nombre: "Premium", cobertura: 150000, incluye: "Cobertura completa, traslados sanitarios y cancelación cubierta.", precio: 1190 },
];

export const catalogo = (origen: Origen, ida: string): Catalogo => ({ vuelos: vuelos(origen, ida), hoteles, asistencias });
