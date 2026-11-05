import { cotizar } from "@/lib/checkout";
import type { Busqueda, Seleccion } from "@/lib/dominio";
import { atender } from "@/lib/http";

export const POST = (request: Request) => atender<{ busqueda: Busqueda; seleccion: Seleccion; anterior?: string; renovar?: boolean }>(
  request, 320, datos => cotizar(datos.busqueda, datos.seleccion, datos.anterior, Date.now(), datos.renovar === true),
);
