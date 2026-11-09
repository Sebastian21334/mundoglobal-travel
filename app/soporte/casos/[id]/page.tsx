import { SoporteCaso } from "@/components/soporte-casos";
export const metadata = { title: "Atención de caso · Soporte" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SoporteCaso id={(await params).id}/>;
}
