// Wrapper de un campo de formulario: label + input/select + error.
// Uso intencional para mantener consistencia visual en TODOS los formularios
// del sistema (crear usuario, editar cliente, registrar prestamo, etc.).
"use client";
import type { ReactNode } from "react";

interface FormFieldProps {
  // ID que se usa en htmlFor del label y en el id del input hijo.
  id: string;
  // Etiqueta visible. Si es opcional, indicar con asterisco en el texto.
  label: string;
  // Campo es requerido. Solo es visual (asterisco rojo).
  // La validacion real va en el schema de zod.
  required?: boolean;
  // Mensaje de error a mostrar bajo el campo.
  error?: string;
  // Texto auxiliar bajo el campo (cuando no hay error).
  helpText?: string;
  // El input/select/textarea hijo. El consumidor lo pasa con el id correcto.
  children: ReactNode;
}

export function FormField({
  id,
  label,
  required,
  error,
  helpText,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium"
        style={{ color: "var(--color-foreground)" }}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>

      <div className="mt-1">{children}</div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helpText ? (
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

// Estilos reutilizables para inputs/selects. Los exportamos para que cualquier formulario los use y mantenga la apariencia consistente.
// Se aplican como className al input/select hijo.
export const INPUT_CLASSES =
  "block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:opacity-60";

export const INPUT_STYLE = {
  backgroundColor: "var(--color-background)",
  borderColor: "var(--color-input)",
  color: "var(--color-foreground)",
} as const;