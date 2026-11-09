import type { Aviso, Caso, EstadoCaso, Intervencion, TipoAviso } from "./dominio";

export const estadosCaso: EstadoCaso[] = ["Abierto", "En gestión", "Esperando al viajero", "Cerrado"];
export const estadoCaso = (caso: Caso): EstadoCaso => caso.cerrado ? "Cerrado" : caso.estado ?? "Abierto";
export const enlaceCaso = (caso: Pick<Caso, "id" | "reserva">) => "/mis-viajes/" + caso.reserva + "/casos/" + caso.id;

export function crearAviso(reserva: string, tipo: TipoAviso, titulo: string, detalle: string, fecha = new Date().toISOString(), enlace?: string): Aviso {
  return { id: crypto.randomUUID(), reserva, tipo, titulo, detalle, fecha, enlace };
}

type Autoria = Pick<Intervencion, "autor" | "rol">;

export function intervenir(caso: Caso, autoria: Autoria, tipo: Intervencion["tipo"], texto: string, fecha: string, cambios: Partial<Caso> = {}): Caso {
  const intervencion: Intervencion = { id: crypto.randomUUID(), ...autoria, tipo, texto, fecha };
  return { ...caso, ...cambios, intervenciones: [...(caso.intervenciones ?? []), intervencion] };
}

export function cambiarEstado(caso: Caso, autor: string, estado: EstadoCaso, fecha: string, resolucion?: string): Caso {
  const cerrado = estado === "Cerrado";
  return intervenir(caso, { autor, rol: "Soporte" }, "estado", "Estado actualizado a " + estado + ".", fecha, {
    estado, cerrado: cerrado ? fecha : undefined,
    resolucion: cerrado ? resolucion ?? caso.resolucion ?? "Revisión finalizada por Soporte Digital." : undefined,
  });
}
