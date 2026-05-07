// Sidebar principal del area autenticada. Tres modos:
//  - Desktop expandido: 256px, muestra texto e iconos
//  - Desktop colapsado: 64px, solo iconos con tooltip
//  - Mobile drawer: 256px, oculto por default, abre con botón hamburguesa
// Usa colores de marca (verde + dorado) en ambos modos del tema.
"use client";
import Link from "next/link";
import Image from "next/image";
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
    const nombres = partes.slice(0, 2).join(" ");     // primeros 2 → nombres
    const apellidos = partes.slice(2).join(" ");  
  return (
    <aside
      // Comportamiento responsive:
      // - mobile: fixed con z-40 (encima del backdrop z-30)
      // - desktop (md+): relative, parte del flex layout
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
          className="rounded-full p-0.5 shrink-0 "
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
        {/* Nombre solo visible si NO esta colapsado en desktop, o si esta en mobile */}
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
          // Filtrar items visibles para el rol activo
          const itemsVisibles = seccion.items.filter((item) =>
            itemVisibleParaRol(item, rolActivo),
          );

          // Si la seccion queda vacia tras el filtro, no la renderizamos
          if (itemsVisibles.length === 0) return null;

          return (
            <div key={seccion.id} className="mb-4">
              {/* Titulo de seccion visible solo si NO esta colapsado */}
              {(!isCollapsed || isMobile) && (
                <h3
                  className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-header-muted)" }}
                >
                  {seccion.title}
                </h3>
              )}

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
          {/* Avatar circular con la inicial del usuario */}
          <div
            className="flex h-9 w-9 shrink-0 text-foreground items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: "var(--color-header-accent)",
            }}
          >
            {user.userName.charAt(0).toUpperCase()}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-medium truncate">
                {nombres}
              </span>
              <span className="text-sm font-medium truncate">
                {apellidos}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// Subcomponente: un item individual del sidebar.
// Se separa para mantener la complejidad del Sidebar manejable.
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

  // Item activo: ruta actual coincide o empieza con el href del item.
  // startsWith permite que rutas hijas (ej: /admin/usuarios/123) marquen
  // como activo el item padre (/admin/usuarios).
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + "/")
    : false;

  // Tooltip nativo cuando esta colapsado (title attribute).
  // Cuando expandido, no necesita tooltip porque el texto esta visible.
  const tooltip = isCollapsed
    ? item.comingSoon
      ? `${item.label} (Sprint ${item.sprint})`
      : item.label
    : undefined;

  // Estilos comunes de layout. La diferencia visual va en bgColor inline.
  const baseClasses =
    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";

  // Item proximamente: render como div no clickeable, opacidad reducida.
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

  // Item activo: fondo dorado, texto verde oscuro (alto contraste).
  // Item inactivo: hover dorado tenue, texto blanco semi.
  const linkStyle = isActive
    ? {
        backgroundColor: "var(--color-header-accent)",
        color: "#0a0f0a",
      }
    : {
        color: "rgba(255, 255, 255, 0.85)",
      };

  return (
    <Link
      href={item.href}
      title={tooltip}
      onClick={onClickItem}
      className={baseClasses}
      style={linkStyle}
      onMouseEnter={(e) => {
        // Hover solo si NO esta activo (el activo ya tiene fondo dorado).
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