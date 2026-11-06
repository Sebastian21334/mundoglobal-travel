import type { Metadata } from "next";
import { Instrument_Serif, Public_Sans } from "next/font/google";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/demo";
import "./globals.css";

const serif = Instrument_Serif({ weight: ["400"], style: ["normal", "italic"], subsets: ["latin"], variable: "--type-serif", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], variable: "--type-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "MundoGlobal Travel · Paquetes de viaje", template: "%s · MundoGlobal Travel" },
  description: "Cotizá vuelos, hotel All Inclusive y asistencia al viajero en un solo paquete de demostración.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR" className={serif.variable + " " + sans.variable}>
    <body><a href="#contenido" className="salto">Ir al contenido</a><Cabecera />{children}<Pie /></body>
  </html>;
}
