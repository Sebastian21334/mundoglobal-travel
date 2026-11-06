import type { Asistencia, Busqueda, Catalogo, Destino, Hotel, Origen, Vuelo } from "../dominio";
import { codigoDestino } from "./destinos";

export const origenes = { COR: "Córdoba", EZE: "Buenos Aires" };
const lineas = ["Austral del Sur", "Ala Caribe", "Latitud Atlántica"];

type Horario = [salida: string, llegada: string, duracion: string, escala: string];
type Ruta = { precio: number[]; numeros: string[]; regreso: string[] } & Record<Origen, Horario[]>;
const rutas: Record<Destino, Ruta> = {
  PUJ: {
    EZE: [["07:25","13:38","06 h 13","Directo"],["10:50","17:06","06 h 16","Directo"],["19:40","01:55 +1","06 h 15","Directo"]],
    COR: [["05:50","15:20","09 h 30","1 escala en Panamá"],["08:15","18:20","10 h 05","1 escala en Lima"],["12:35","22:15","09 h 40","1 escala en Bogotá"]],
    precio: [52200, 46800, 58400], numeros: ["406","217","542"], regreso: ["15:35","13:20","16:10"],
  },
  CUN: {
    EZE: [["08:00","14:40","08 h 40","Directo"],["06:25","16:10","11 h 45","1 escala en Lima"],["09:30","19:40","12 h 10","1 escala en Panamá"]],
    COR: [["05:40","15:45","12 h 05","1 escala en Panamá"],["07:05","16:50","11 h 45","1 escala en Lima"],["09:20","20:05","12 h 45","1 escala en Bogotá"]],
    precio: [64800, 58300, 62100], numeros: ["410","245","573"], regreso: ["14:50","10:45","13:15"],
  },
  AUA: {
    EZE: [["06:10","14:30","09 h 20","1 escala en Panamá"],["07:45","17:20","10 h 35","1 escala en Bogotá"],["09:25","19:10","10 h 45","1 escala en Lima"]],
    COR: [["05:15","15:10","10 h 55","1 escala en Panamá"],["08:05","18:35","11 h 30","1 escala en Bogotá"],["09:30","21:15","12 h 45","1 escala en Lima"]],
    precio: [69800, 65200, 71700], numeros: ["433","271","588"], regreso: ["13:35","11:20","14:25"],
  },
  REC: {
    EZE: [["07:00","12:05","05 h 05","Directo"],["08:30","16:45","08 h 15","1 escala en São Paulo"],["11:05","18:35","07 h 30","1 escala en Río de Janeiro"]],
    COR: [["06:10","14:25","08 h 15","1 escala en Buenos Aires"],["08:05","16:00","07 h 55","1 escala en São Paulo"],["10:30","19:15","08 h 45","1 escala en Río de Janeiro"]],
    precio: [44900, 39200, 42500], numeros: ["482","292","594"], regreso: ["14:30","12:45","15:50"],
  },
};

export function vuelos(busqueda: Busqueda): Vuelo[] {
  const { origen, ida } = busqueda;
  const destino = codigoDestino(busqueda);
  const ruta = rutas[destino];
  const ajuste = (Number(ida.slice(-2)) % 4) * 1500;
  return ruta[origen].map(([salida, llegada, duracion, escala], i) => ({
    id: (destino === "PUJ" ? "" : destino + "-") + origen + "-" + (i + 1),
    linea: lineas[i], codigo: ["AS ", "AC ", "LA "][i] + ruta.numeros[i],
    salida, llegada, duracion, escala, regreso: ruta.regreso[i],
    equipaje: i === 0 ? "Cabina 10 kg + valija 23 kg" : i === 1 ? "Cabina 10 kg" : "Cabina 8 kg + valija 23 kg",
    precio: ruta.precio[i] + ajuste + (origen === "COR" ? 3200 : 0),
  }));
}

const estadias: Record<Destino, Hotel[]> = {
  PUJ: [
    { id: "arena", nombre: "Casa Arena Bávaro", estrellas: 4, zona: "Bávaro", incluye: "Playa, buffet, bebidas de la casa y dos piscinas.", politica: "Cambios sujetos a cupo hasta 72 h antes del ingreso.", precio: 8900 },
    { id: "mangle", nombre: "Los Manglares de Macao", estrellas: 4, zona: "Playa Macao", incluye: "Buffet, dos cenas a la carta y actividades de playa.", politica: "Permite un cambio hasta 7 días antes del ingreso.", precio: 10400 },
    { id: "coral", nombre: "Bahía Coral Cap Cana", estrellas: 5, zona: "Cap Cana", incluye: "Restaurantes a la carta, bebidas premium y club de playa.", politica: "Cambios sujetos a diferencia de tarifa hasta 48 h antes.", precio: 14900 },
  ],
  CUN: [
    { id: "cun-sol", nombre: "Costa del Sol Cancún", estrellas: 4, zona: "Zona Hotelera", incluye: "Buffet, bar de playa y actividades junto a la piscina.", politica: "Un cambio sujeto a cupo hasta 72 h antes del ingreso.", precio: 9500 },
    { id: "cun-laguna", nombre: "Laguna Clara Resort", estrellas: 4, zona: "Costa Mujeres", incluye: "Buffet, dos cenas a la carta y club infantil.", politica: "Cambios sujetos a cupo hasta 7 días antes del ingreso.", precio: 12100 },
    { id: "cun-jade", nombre: "Jade Azul Riviera", estrellas: 5, zona: "Riviera Maya", incluye: "Restaurantes a la carta, bebidas premium y club de playa.", politica: "Cambios con diferencia de tarifa hasta 48 h antes.", precio: 15700 },
  ],
  AUA: [
    { id: "aua-dunas", nombre: "Dunas de Eagle Resort", estrellas: 4, zona: "Eagle Beach", incluye: "Buffet, bebidas de la casa y servicio de playa.", politica: "Cambios sujetos a cupo hasta 72 h antes del ingreso.", precio: 10900 },
    { id: "aua-palma", nombre: "Palma Serena Aruba", estrellas: 4, zona: "Palm Beach", incluye: "Buffet, dos cenas a la carta y actividades de piscina.", politica: "Permite un cambio hasta 7 días antes del ingreso.", precio: 13700 },
    { id: "aua-sal", nombre: "Sal de Mar Resort", estrellas: 5, zona: "Noord", incluye: "Restaurantes a la carta, bebidas premium y zona de playa.", politica: "Cambios sujetos a diferencia de tarifa hasta 48 h antes.", precio: 17900 },
  ],
  REC: [
    { id: "rec-mar", nombre: "Maré Mansa Resort", estrellas: 4, zona: "Cupe", incluye: "Buffet regional, bebidas de la casa y piscinas.", politica: "Cambios sujetos a cupo hasta 72 h antes del ingreso.", precio: 8200 },
    { id: "rec-areia", nombre: "Areia Clara Muro Alto", estrellas: 4, zona: "Muro Alto", incluye: "Buffet, dos cenas a la carta y actividades de playa.", politica: "Permite un cambio hasta 7 días antes del ingreso.", precio: 9900 },
    { id: "rec-recife", nombre: "Recife de Luz Resort", estrellas: 5, zona: "Maracaípe", incluye: "Restaurantes a la carta, bebidas premium y club de playa.", politica: "Cambios sujetos a diferencia de tarifa hasta 48 h antes.", precio: 13600 },
  ],
};

export const hoteles = (busqueda: Busqueda): Hotel[] => estadias[codigoDestino(busqueda)];

export const asistencias: Asistencia[] = [
  { id: "basica", nombre: "Básica", cobertura: 30000, incluye: "Urgencias médicas y teleconsulta 24 h.", precio: 490 },
  { id: "completa", nombre: "Completa", cobertura: 75000, incluye: "Urgencias, medicamentos y demora de equipaje.", precio: 760 },
  { id: "premium", nombre: "Premium", cobertura: 150000, incluye: "Cobertura completa, traslados sanitarios y cancelación cubierta.", precio: 1190 },
];

export const catalogo = (busqueda: Busqueda): Catalogo => ({ vuelos: vuelos(busqueda), hoteles: hoteles(busqueda), asistencias });
