export async function solicitar<T>(ruta: string, datos: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/" + ruta, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "No pudimos completar la operación. Intentá otra vez.");
  return json as T;
}

export const demora = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function atender<T>(request: Request, ms: number, resolver: (datos: T) => unknown) {
  await demora(ms);
  try {
    const datos = await request.json() as T;
    return Response.json(resolver(datos), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "La operación no se pudo completar." }, { status: 400 });
  }
}
