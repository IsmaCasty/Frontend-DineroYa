// Header del area autenticada. Incluye boton hamburguesa que en desktop alterna collapsed del sidebar y en mobile abre/cierra el drawer.
// El logo del header NO se muestra cuando el sidebar esta visible (evita duplicacion).
// En mobile siempre se muestra para preservar identidad.
"use client";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { useSidebar } from "@/lib/sidebar/use-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const { user, logout } = useAuth();
  const { toggle, isMobile } = useSidebar();

  return (
    <header
      className="sticky top-0 z-20 w-full border-b"
      style={{
        backgroundColor: "var(--color-header-bg)",
        color: "var(--color-header-fg)",
        borderColor: "var(--color-header-border)",
      }}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Izquierda: boton hamburguesa + (en mobile) titulo de la empresa */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label="Alternar menu de navegacion"
            title="Alternar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: "var(--color-header-fg)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(201, 162, 39, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
           <span
              className="text-xs"
              style={{ color: "var(--color-header-muted)" }}
            >
               Sistema Web Integrado para la Gestión de Contratos, Cobros y Registro de Clientes
            </span>
          {/* En mobile mostramos el nombre de la empresa porque el sidebar
              esta oculto. En desktop el sidebar ya muestra la marca. */}
          {isMobile && (
            <span className="text-sm font-bold tracking-wide">
              DINERO YA{" "}
              <span style={{ color: "var(--color-header-accent)" }}>
                S.R.L.
              </span>
              <span
              className="text-xs"
              style={{ color: "var(--color-header-muted)" }}
            >
               Sistema de Gestión de Joyas
            </span>
            </span>
          )}
        </div>

        {/* Derecha: usuario + toggle de tema + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium leading-tight">
                {user.userName}
              </p>
              <p
                className="text-xs leading-tight"
                style={{ color: "var(--color-header-muted)" }}
              >
                {user.cargoActivo.nombre}
              </p>
            </div>
          )}

          <ThemeToggle />

          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              borderColor: "var(--color-header-border)",
              color: "var(--color-header-fg)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.85)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}