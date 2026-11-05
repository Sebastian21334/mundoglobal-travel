import { confirmar } from "@/lib/checkout";
import { atender } from "@/lib/http";

export const POST = (request: Request) => atender<{ recibo: string; id: string }>(
  request, 1150, datos => confirmar(datos.recibo, datos.id),
);
