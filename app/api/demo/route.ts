import { generarDemo } from "@/lib/demo";
import { atender } from "@/lib/http";

export const POST = (request: Request) => atender(request, 250, () => generarDemo());
