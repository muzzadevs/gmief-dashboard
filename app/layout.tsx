import type { Metadata } from "next";
import { Poppins } from "@next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GMIEF",
  description: "Desarrollado por Kodaly para KDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/*
        Desarrollado por David Muza Vizarraga para la gloria de Dios, un proyecto ocn mucho amor para una obra que amo con todo mi corazón como es Filadelfia
        */}
      </head>
      <body
        className={`${poppins.variable} antialiased min-h-screen min-w-full`}
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {children}
      </body>
    </html>
  );
}
