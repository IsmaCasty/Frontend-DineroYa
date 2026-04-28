// Estado global del sidebar: colapsado en desktop, abierto en mobile.
// Persistencia del colapsado en localStorage (dy_sidebar_collapsed).
// La apertura mobile NO se persiste, siempre arranca cerrado. evita el patron "useEffect + setState" que
"use client";
import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

// Clave de persistencia. Prefijo dy_ consistente con el resto de la app.
const STORAGE_KEY = "dy_sidebar_collapsed";

// Inicializador lazy: lee localStorage una sola vez al montar.
// SSR-safe porque chequea typeof window antes de tocar localStorage.
function leerCollapsedInicial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

// Helper para escribir a localStorage de forma SSR-safe.
// Se llama desde dentro del setter, no desde un useEffect.
function persistirCollapsed(valor: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(valor));
}

interface SidebarContextValue {
  // En desktop, indica si el sidebar muestra solo iconos (true) o full (false).
  isCollapsed: boolean;
  // En mobile, indica si el drawer esta abierto. Siempre false en desktop.
  isMobileOpen: boolean;
  // True cuando el viewport es < 768px.
  isMobile: boolean;
  // Toggle inteligente: en mobile alterna mobileOpen, en desktop alterna collapsed.
  toggle: () => void;
  // Cierra el drawer mobile. Se usa al hacer click en un item o en el backdrop.
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  // State del collapsed con lazy init. Lee de localStorage una sola vez.
  // El setter escribe a storage en la misma operacion, sin useEffect.
  const [isCollapsedRaw, setIsCollapsedRaw] = useState<boolean>(
    leerCollapsedInicial,
  );

  // State del drawer mobile. Solo se usa cuando isMobile = true.
  // Cuando isMobile pasa a false, ignoramos este valor (ver mas abajo).
  const [isMobileOpenRaw, setIsMobileOpenRaw] = useState<boolean>(false);

  // Detecta el breakpoint mobile. Se actualiza automaticamente al
  // redimensionar la ventana via useSyncExternalStore.
  const isMobile = useIsMobile();

  // VALOR DERIVADO en lugar de state + useEffect:
  // Si no estamos en mobile, false directamente ignorando el state interno. Esto
  // reemplaza el effect que antes hacia setIsMobileOpen(false) cuando
  // isMobile pasaba a false. No hay cascading render porque no hay setState.
  const isMobileOpen = isMobile ? isMobileOpenRaw : false;

  // Setter de collapsed que ademas persiste a localStorage en una sola
  // operacion.
  const setIsCollapsed = useCallback((next: boolean) => {
    setIsCollapsedRaw(next);
    persistirCollapsed(next);
  }, []);

  // Toggle inteligente: en mobile alterna mobileOpen, en desktop collapsed.
  // Usamos el valor mas reciente con la forma funcional de setState.
  const toggle = useCallback(() => {
    if (isMobile) {
      setIsMobileOpenRaw((prev) => !prev);
    } else {
      setIsCollapsedRaw((prev) => {
        const next = !prev;
        persistirCollapsed(next);
        return next;
      });
    }
  }, [isMobile]);

  // Cierra el drawer mobile. Se llama desde el backdrop y al elegir un item.
  const closeMobile = useCallback(() => {
    setIsMobileOpenRaw(false);
  }, []);

  // El "isCollapsed" expuesto al context es siempre el state crudo en desktop.
  // En mobile no usamos collapsed (el drawer es full-width), asi que devolver
  // el valor crudo igual no tiene efecto visual porque el sidebar mobile
  // ignora isCollapsed (ver componente Sidebar).
  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: isCollapsedRaw,
        isMobileOpen,
        isMobile,
        toggle,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}