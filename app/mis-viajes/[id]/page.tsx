import { Detalle } from "@/components/viajes";
export const metadata = { title: "Detalle de viaje" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Detalle id={(await params).id}/>;
}
