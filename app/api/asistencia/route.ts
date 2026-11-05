import { asistencias } from "@/lib/datos/catalogos";
import { atender } from "@/lib/http";

export const POST = (request: Request) => atender(request, 480, () => asistencias);
