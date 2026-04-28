// Toggle de tema claro/oscuro SIN hydration mismatch.
// Tecnica: renderizamos AMBOS iconos (Sun y Moon) en el HTML y dejamos
// que CSS decida cual mostrar segun la clase .dark del <html>.
// El servidor no sabe el tema (no tiene acceso a localStorage), pero
// ambos iconos quedan en el DOM, asi que el HTML del servidor coincide
// con el del cliente. Sin mismatch.
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/use-theme";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      // aria-label generico que cubre ambos casos. Lectores de pantalla
      // anuncian "Cambiar tema" sin importar el estado actual.
      aria-label="Cambiar tema claro/oscuro"
      title="Cambiar tema"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderColor: "var(--color-header-border)",
        color: "var(--color-header-fg)",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(201, 162, 39, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Ambos iconos en el DOM, CSS oculta uno segun tema activo.
          La clase "dark:hidden" oculta el icono en modo oscuro y "hidden dark:block" lo muestra solo en modo oscuro. */}
      <Moon
        className="h-4 w-4 dark:hidden"
        aria-hidden="true"
      />
      <Sun
        className="hidden h-4 w-4 dark:block"
        aria-hidden="true"
      />
    </button>
  );
}