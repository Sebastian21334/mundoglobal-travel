import { createHmac, timingSafeEqual } from "node:crypto";

const secreto = () => process.env.MGT_SIGNING_SECRET ?? "mundoglobal-demo-v1-utn-grupo-r";
const firma = (contenido: string) => createHmac("sha256", secreto()).update(contenido).digest("base64url");

export const referencia = (tipo: string, clave: string) =>
  tipo + "-" + firma(tipo + ":" + clave).slice(0, 10).replace(/[-_]/g, "X").toUpperCase();

export function firmar<T>(tipo: string, valor: T): string {
  const carga = Buffer.from(JSON.stringify(valor)).toString("base64url");
  return carga + "." + firma(tipo + ":" + carga);
}

export function verificar<T>(tipo: string, token: unknown): T {
  if (typeof token !== "string" || token.length > 9000) throw new Error("La operación no tiene una firma válida.");
  const [carga, sello, sobrante] = token.split(".");
  if (!carga || !sello || sobrante !== undefined) throw new Error("La operación no tiene una firma válida.");
  const esperada = Buffer.from(firma(tipo + ":" + carga));
  const recibida = Buffer.from(sello);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    throw new Error("La operación no tiene una firma válida.");
  }
  return JSON.parse(Buffer.from(carga, "base64url").toString("utf8")) as T;
}
