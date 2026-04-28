// Capa oscura que aparece detras del drawer en mobile cuando esta abierto.
// Click en el backdrop = cerrar el drawer. Solo se muestra en mobile.
"use client";
import { useSidebar } from "@/lib/sidebar/use-sidebar";

export function MobileBackdrop() {
  const { isMobile, isMobileOpen, closeMobile } = useSidebar();

  // Solo renderizar si estamos en mobile Y el drawer esta abierto.
  // Si renderizamos siempre con opacity 0, el div invisible bloquea clicks.
  if (!isMobile || !isMobileOpen) return null;

  return (
    <div
      onClick={closeMobile}
      // aria-hidden porque es decorativo: el cierre tambien se puede hacer
      // con el boton hamburguesa, que si es accesible.
      aria-hidden="true"
      className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
    />
  );
}