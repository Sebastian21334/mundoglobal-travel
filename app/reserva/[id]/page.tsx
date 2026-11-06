import { PantallaReserva } from "@/components/confirmacion";
export const metadata = { title: "Estado de reserva" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PantallaReserva id={(await params).id}/>;
}
