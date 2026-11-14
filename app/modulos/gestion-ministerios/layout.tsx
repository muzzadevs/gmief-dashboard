import type { ReactNode } from "react";
import BuscadorGlobal from "./BuscadorGlobal";

export default function GestionMinisteriosLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <BuscadorGlobal />
    </>
  );
}
