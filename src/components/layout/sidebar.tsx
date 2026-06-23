// Sidebar principal del area autenticada. Tres modos:
//  - Desktop expandido: 256px, muestra texto e iconos
//  - Desktop colapsado: 64px, solo iconos con tooltip
//  - Mobile drawer: 256px, oculto por default, abre con botón hamburguesa
// Usa colores de marca (verde + dorado) en ambos modos del tema.
"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { useSidebar } from "@/lib/sidebar/use-sidebar";
import {
  SIDEBAR_SECTIONS,
  type SidebarItem,
  type Role,
} from "@/lib/sidebar/sidebar-items";

// Verifica si el item es visible para el rol activo del usuario.
// Sin roles definidos = visible para todos.
function itemVisibleParaRol(item: SidebarItem, rolActivo: string): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  return (item.roles as readonly string[]).includes(rolActivo);
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isCollapsed, isMobile, isMobileOpen, closeMobile } = useSidebar();

  // Set vacío = todas las secciones expandidas por defecto.
  // El accordion solo aplica cuando el sidebar está en modo 256px (expandido).
  // En modo 64px (isCollapsed=true) siempre se muestran todos los iconos sin accordion.
  const [seccionesColapsadas, setSeccionesColapsadas] = useState<Set<string>>(
    new Set()
  );

  const toggleSeccion = (id: string) => {
    setSeccionesColapsadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Si por alguna razon no hay user, no renderizamos. El layout protegido
  // ya garantiza esto, pero mantenemos guard defensivo.
  if (!user) return null;

  const rolActivo: Role = user.cargoActivo.nombre as Role;

  // En desktop el ancho depende de collapsed. En mobile siempre w-64
  // (porque cuando esta cerrado se oculta con translate, no con width).
  const anchoDesktop = isCollapsed ? "md:w-16" : "md:w-64";

  // Translate para mobile: -100% cuando cerrado, 0 cuando abierto.
  // En desktop siempre translate-x-0 (visible).
  const translateMobile = isMobileOpen
    ? "translate-x-0"
    : "-translate-x-full md:translate-x-0";

  const partes = user.nombreCompleto.split(" ");
  const nombres = partes.slice(0, 2).join(" ");
  const apellidos = partes.slice(2).join(" ");

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex w-64 flex-col
        md:sticky md:top-0 md:z-0 md:h-screen md:translate-x-0
        ${anchoDesktop}
        ${translateMobile}
        transition-all duration-200 ease-in-out
        border-r overflow-hidden
      `}
      style={{
        backgroundColor: "var(--color-header-bg)",
        color: "var(--color-header-fg)",
        borderColor: "var(--color-header-border)",
      }}
      aria-label="Navegacion principal"
    >
      {/* Cabecera del sidebar: logo + nombre. En collapsed solo el logo. */}
      <div
        className={`flex h-16 shrink-0 gap-3 border-b px-4 items-center ${
          isCollapsed ? "justify-center" : "justify-start px-4"
        }`}
        style={{ borderColor: "var(--color-header-border)" }}
      >
        <div
          className="rounded-full p-0.5 shrink-0"
          style={{ backgroundColor: "var(--color-header-accent)" }}
        >
          <Image
            src="/logo1.png"
            alt="Dinero Ya S.R.L."
            width={40}
            height={40}
            className="w-auto h-auto rounded-full"
            priority
          />
        </div>
        {(!isCollapsed || isMobile) && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-sm font-bold tracking-wide whitespace-nowrap">
              DINERO YA{" "}
              <span style={{ color: "var(--color-header-accent)" }}>
                S.R.L.
              </span>
            </span>
            <span
              className="text-[11px] whitespace-nowrap"
              style={{ color: "var(--color-header-muted)" }}
            >
              Préstamo Prendario
            </span>
          </div>
        )}
      </div>

      {/* Contenido scrolleable: las secciones de navegacion */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scroll">
        {SIDEBAR_SECTIONS.map((seccion) => {
          const itemsVisibles = seccion.items.filter((item) =>
            itemVisibleParaRol(item, rolActivo)
          );

          if (itemsVisibles.length === 0) return null;

          // En modo 64px el accordion no aplica: siempre mostramos los iconos.
          const estaColapsada =
            !isCollapsed && seccionesColapsadas.has(seccion.id);

          return (
            <div key={seccion.id} className="mb-4">
              {/* Titulo de seccion: botón clickeable cuando el sidebar está expandido */}
              {(!isCollapsed || isMobile) && (
                <button
                  type="button"
                  onClick={() => toggleSeccion(seccion.id)}
                  className="w-full flex items-center justify-between px-4 mb-1 py-0.5 rounded transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-header-muted)" }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {seccion.title}
                  </span>
                  <ChevronDown
                    className="h-3 w-3 shrink-0 transition-transform duration-200"
                    style={{
                      transform: estaColapsada
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </button>
              )}

              {/* Items: se ocultan cuando la sección está colapsada.
                  En modo 64px siempre visibles (sin accordion). */}
              {!estaColapsada && (
                <ul className="space-y-0.5 px-2">
                  {itemsVisibles.map((item) => (
                    <li key={item.label}>
                      <SidebarLink
                        item={item}
                        pathname={pathname}
                        isCollapsed={isCollapsed && !isMobile}
                        onClickItem={isMobile ? closeMobile : undefined}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer del sidebar: info del usuario activo */}
      <div
        className="shrink-0 border-t p-3"
        style={{ borderColor: "var(--color-header-border)" }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="flex h-9 w-9 shrink-0 text-foreground items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: "var(--color-header-accent)" }}
          >
            {user.userName.charAt(0).toUpperCase()}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-medium truncate">{nombres}</span>
              <span className="text-sm font-medium truncate">{apellidos}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// Subcomponente: un item individual del sidebar.
interface SidebarLinkProps {
  item: SidebarItem;
  pathname: string;
  isCollapsed: boolean;
  onClickItem?: () => void;
}

function SidebarLink({
  item,
  pathname,
  isCollapsed,
  onClickItem,
}: SidebarLinkProps) {
  const Icon = item.icon;

  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + "/")
    : false;

  const tooltip = isCollapsed
    ? item.comingSoon
      ? `${item.label} (Sprint ${item.sprint})`
      : item.label
    : undefined;

  const baseClasses =
    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";

  if (item.comingSoon || !item.href) {
    return (
      <div
        title={tooltip}
        className={`${baseClasses} cursor-not-allowed opacity-50`}
        style={{ color: "var(--color-header-muted)" }}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            <span
              className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(201, 162, 39, 0.15)",
                color: "var(--color-header-accent)",
              }}
            >
              Pronto
            </span>
          </>
        )}
      </div>
    );
  }

  const linkStyle = isActive
    ? { backgroundColor: "var(--color-header-accent)", color: "#0a0f0a" }
    : { color: "rgba(255, 255, 255, 0.85)" };

  return (
    <Link
      href={item.href}
      title={tooltip}
      onClick={onClickItem}
      className={baseClasses}
      style={linkStyle}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "rgba(201, 162, 39, 0.15)";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
        }
      }}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
    </Link>
  );
}