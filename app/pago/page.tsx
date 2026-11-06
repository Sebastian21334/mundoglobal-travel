import { PantallaPago } from "@/components/pago";
export const metadata = { title: "Pago" };
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <PantallaPago id={id}/>;
}
