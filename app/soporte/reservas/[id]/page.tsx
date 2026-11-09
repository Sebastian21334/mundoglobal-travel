import { SoporteReserva } from "@/components/soporte-reservas";
export const metadata = { title: "Ficha de reserva · Soporte" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SoporteReserva id={(await params).id}/>;
}
