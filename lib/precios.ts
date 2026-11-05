import type { Busqueda, Catalogo, Precios, Seleccion } from "./dominio";

const dia = 86_400_000;
export const formatoUSD = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd = (centavos: number) => "USD " + formatoUSD.format(centavos / 100);
export const isoDia = (fecha: number) => new Date(fecha).toISOString().slice(0, 10);
export const sumarDias = (fecha: string, dias: number) => isoDia(Date.parse(fecha + "T00:00:00Z") + dias * dia);
export const noches = ({ ida, vuelta }: Busqueda) => (Date.parse(vuelta) - Date.parse(ida)) / dia;
export const fechaCorta = (fecha: string) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(fecha + "T00:00:00Z"));
export const fechaHora = (fecha: string) => new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(fecha));

function fechaValida(fecha: unknown): fecha is string {
  return typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    Number.isFinite(Date.parse(fecha)) && isoDia(Date.parse(fecha)) === fecha;
}

export function errorBusqueda(datos: unknown, hoy = isoDia(Date.now())): string | null {
  if (!datos || typeof datos !== "object") return "Completá los datos del viaje.";
  const { origen, ida, vuelta, pasajeros } = datos as Partial<Busqueda>;
  if (origen !== "COR" && origen !== "EZE") return "Elegí Córdoba o Buenos Aires como origen.";
  if (!fechaValida(ida) || !fechaValida(vuelta) || ida < hoy) return "Elegí fechas válidas desde hoy.";
  const duracion = noches({ origen, ida, vuelta, pasajeros: 1 });
  if (duracion < 5 || duracion > 14) return "La estadía tiene que ser de 5 a 14 noches.";
  if (!Number.isInteger(pasajeros) || pasajeros! < 1 || pasajeros! > 6) return "Elegí entre 1 y 6 viajeros.";
  return null;
}

export function elegidos(catalogo: Catalogo, seleccion: Seleccion) {
  const vuelo = catalogo.vuelos.find(item => item.id === seleccion?.vuelo);
  const hotel = catalogo.hoteles.find(item => item.id === seleccion?.hotel);
  const asistencia = catalogo.asistencias.find(item => item.id === seleccion?.asistencia);
  if (!vuelo || !hotel || !asistencia) throw new Error("Hay un servicio que ya no está disponible. Volvé a cotizar.");
  return { vuelo, hotel, asistencia };
}

export function calcularPrecios(busqueda: Busqueda, catalogo: Catalogo, seleccion: Seleccion, recargo = 0): Precios {
  const items = elegidos(catalogo, seleccion);
  const estadia = noches(busqueda);
  const vuelo = (items.vuelo.precio + recargo) * busqueda.pasajeros;
  const hotel = items.hotel.precio * estadia * busqueda.pasajeros;
  const asistencia = items.asistencia.precio * (estadia + 1) * busqueda.pasajeros;
  return { vuelo, hotel, asistencia, total: vuelo + hotel + asistencia };
}

export const mismaSeleccion = (a: Seleccion, b: Seleccion) =>
  a.vuelo === b.vuelo && a.hotel === b.hotel && a.asistencia === b.asistencia;
