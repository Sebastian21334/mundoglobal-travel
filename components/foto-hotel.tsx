import Image from "next/image";

export function FotoHotel({ id, className, sizes }: { id: string; className: string; sizes: string }) {
  return <Image src={`/fotos/hoteles/${id}.webp`} alt="" width={640} height={427} className={className} sizes={sizes}/>;
}
