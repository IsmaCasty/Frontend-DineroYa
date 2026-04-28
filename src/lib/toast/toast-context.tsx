// Sistema de notificaciones toast minimalista, sin dependencias externas.
// Soporta tres tipos: success (verde), error (rojo), info (verde marca).
// Auto-cierran a los 5 segundos por default. Stack vertical en bottom-right.
// Patron: provider en el root del area autenticada, hook useToast() en cualquier componente que necesite mostrar una notificacion.
"use client";
import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";

// Tipos de toast soportados. Cada tipo tiene su color y semantica.
export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  // Crea un toast nuevo. Retorna el id por si se quiere cerrar manualmente.
  showToast: (message: string, type?: ToastType) => number;
  // Cierra un toast por id antes de su expiracion automatica.
  closeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// Duracion por default antes del auto-cierre. 5s es estandar para
// notificaciones no criticas. Mensajes de error usan el mismo tiempo.
const DEFAULT_DURATION_MS = 5000;

// Contador global para generar ids unicos. Se mantiene fuera del componente
// para que persista entre renders sin necesidad de useRef.
let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cerrar un toast por id. useCallback para estabilidad referencial.
  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Crear un toast nuevo. Programa el auto-cierre con setTimeout dentro
  // del handler (no en useEffect) porque el cierre es respuesta a una
  // accion explicita: la creacion del toast.
  const showToast = useCallback(
    (message: string, type: ToastType = "info"): number => {
      const id = nextToastId++;
      const toast: Toast = { id, message, type };
      setToasts((prev) => [...prev, toast]);

      // Auto-cierre. Si el componente se desmonta antes del timeout,
      // el setState fallara silenciosamente (React lo maneja en strict mode).
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, DEFAULT_DURATION_MS);

      return id;
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}
      {/* Stack de toasts visibles. Fixed bottom-right, z-50 sobre todo */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Componente individual del toast. Aislado para que cada uno pueda animar
// su entrada/salida sin afectar a los demas.
interface ToastItemProps {
  toast: Toast;
  onClose: (id: number) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  // Colores segun tipo. Hardcodeamos para no depender de variables CSS que puedan no resolver. Los toasts deben verse igual en claro y oscuro.
  const config = {
    success: {
      bg: "#16a34a",
      icon: "✓",
    },
    error: {
      bg: "#dc2626",
      icon: "✕",
    },
    info: {
      bg: "#1a3a1a",
      icon: "i",
    },
  }[toast.type];

  return (
    <div
    role="alert"
    className="pointer-events-auto flex min-w-70 max-w-md items-start gap-3 rounded-md px-4 py-3 text-white shadow-lg"
    style={{
      backgroundColor: config.bg,
      animation: "dyToastSlideIn 200ms ease-out",
    }}
  >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-bold"
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <p className="flex-1 text-sm leading-tight">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Cerrar notificacion"
        className="shrink-0 text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}