import { CasoViajero } from "@/components/casos";
export const metadata = { title: "Seguimiento del caso" };
export default async function Page({ params }: { params: Promise<{ id: string; caso: string }> }) {
  const { id, caso } = await params;
  return <CasoViajero reservaId={id} id={caso}/>;
}
