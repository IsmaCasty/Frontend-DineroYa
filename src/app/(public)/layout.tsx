// Layout de paginas publicas. Usa colores de marca hardcoded (#0f2910,
// #1a3a1a, #081608) en vez de variables CSS para garantizar que se vean
// siempre, sin depender de la carga de Tailwind v4 o caches de Next.js.
// Estos colores no cambian con el tema, son identidad fija de la empresa.

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DecoracionesJoyas } from "@/components/layout/decoraciones-joyas";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8"
      style={{
        // Color base del fondo (por si el gradiente no carga).
        backgroundColor: "#0f2910",
        // Gradiente radial: centro mas claro (#1a3a1a) hacia bordes
        // mas oscuros (#081608). Da sensacion de foco al formulario.
        backgroundImage:
          "radial-gradient(ellipse at center, #1a3a1a 0%, #081608 100%)",
      }}
    >
      {/* Decoraciones doradas (anillos, gemas, chispas) */}
      <DecoracionesJoyas />

      {/* Toggle de tema flotante arriba a la derecha */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Contenido principal por encima de las decoraciones */}
      <main className="relative z-10 w-full">{children}</main>

      {/* Pie de pagina */}
      <footer
        className="relative z-10 mt-8 text-center text-xs"
        style={{ color: "rgba(255, 255, 255, 0.55)" }}
      >
        <p>
          Dinero Ya S.R.L. {new Date().getFullYear()} | La Paz, Bolivia
        </p>
      </footer>
    </div>
  );
}