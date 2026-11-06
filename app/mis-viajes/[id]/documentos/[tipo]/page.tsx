import { notFound } from "next/navigation";
import { Documento } from "@/components/documento";
import { documentos, type TipoDocumento } from "@/lib/viaje";

export const metadata = { title: "Documento de viaje" };
export default async function Page({ params }: { params: Promise<{ id: string; tipo: string }> }) {
  const { id, tipo } = await params;
  if (!Object.hasOwn(documentos, tipo)) notFound();
  return <Documento id={id} tipo={tipo as TipoDocumento}/>;
}
