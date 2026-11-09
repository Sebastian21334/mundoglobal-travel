import { PantallaPasajeros } from "@/components/pasajeros";
export const metadata = { title: "Pasajeros" };
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <PantallaPasajeros id={id}/>;
}
