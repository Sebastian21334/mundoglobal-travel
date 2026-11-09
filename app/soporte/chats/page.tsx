import { SoporteChats } from "@/components/soporte-chats";
export const metadata = { title: "Chats · Soporte" };
export default async function Page({ searchParams }: { searchParams: Promise<{ reserva?: string }> }) {
  const { reserva } = await searchParams;
  return <SoporteChats inicial={reserva}/>;
}
