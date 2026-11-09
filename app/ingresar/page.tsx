import { Ingreso } from "@/components/acceso";
export const metadata = { title: "Ingresar" };
export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  return <Ingreso volver={volver}/>;
}
