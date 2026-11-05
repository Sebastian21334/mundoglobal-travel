import { autorizar, esEscenario } from "@/lib/checkout";
import { atender } from "@/lib/http";

export const POST = (request: Request) => atender<{ token: string; clave: string; escenario?: string; reintento?: boolean }>(
  request, 780, datos => autorizar(datos.token, datos.clave, esEscenario(datos.escenario) ? datos.escenario : "normal", datos.reintento === true),
);
