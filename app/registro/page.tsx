import { Registro } from "@/components/acceso";
export const metadata = { title: "Crear cuenta" };
export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  return <Registro volver={volver}/>;
}
