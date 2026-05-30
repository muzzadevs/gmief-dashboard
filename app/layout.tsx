import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "filadelfiaConecta",
  description: "Desarrollado por Kodaly para KDK",
  icons: {
    icon: "/faviconFC.ico",
    shortcut: "/faviconFC.ico",
    apple: "/faviconFC.ico",
  },
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
        Desarrollado por David Muza Vizarraga para la gloria de Dios, un proyecto con mucho amor para una obra que amo con todo mi corazón como es Filadelfia
        */}
      </head>
      <body
        className={`${poppins.variable} antialiased min-h-screen min-h-dvh w-full`}
      >
        {children}
      </body>
    </html>
  );
}
