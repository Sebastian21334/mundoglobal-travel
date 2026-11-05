import { vuelos } from "@/lib/datos/catalogos";
import type { Busqueda } from "@/lib/dominio";
import { atender } from "@/lib/http";
import { errorBusqueda } from "@/lib/precios";

export const POST = (request: Request) => atender<Busqueda>(request, 740, datos => {
  const error = errorBusqueda(datos);
  if (error) throw new Error(error);
  return vuelos(datos.origen, datos.ida);
});
