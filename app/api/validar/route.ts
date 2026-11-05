import { esEscenario, validar } from "@/lib/checkout";
import { atender } from "@/lib/http";

export const POST = (request: Request) => atender<{ token: string; escenario?: string }>(
  request, 620, datos => validar(datos.token, esEscenario(datos.escenario) ? datos.escenario : "normal"),
);
