// Modal accesible basado en @radix-ui/react-dialog.
// Provee: focus trap, ESC para cerrar, click en backdrop para cerrar, animaciones, aria-* correctos. Estilos consistentes con el sistema.
"use client";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalProps {
  // Estado controlado. El padre maneja el abierto/cerrado.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Titulo visible y accesible (lectores de pantalla).
  title: string;
  // Subtitulo opcional bajo el titulo.
  description?: string;
  // Contenido del modal.
  children: ReactNode;
  // Ancho maximo. Por default sm (max-w-md). Para formularios usar md o lg.
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "sm",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop oscuro semitransparente. Click cierra el modal. */}
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          style={{ animation: "dyFadeIn 150ms ease-out" }}
        />

        {/* Contenedor del modal centrado vertical y horizontalmente.
            max-h-[90vh] + overflow-y-auto permite scroll en formularios largos. */}
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 ${SIZE_CLASS[size]} max-h-[90vh] overflow-y-auto rounded-lg border shadow-xl`}
          style={{
            backgroundColor: "var(--color-card)",
            color: "var(--color-card-foreground)",
            borderColor: "var(--color-border)",
            animation: "dyModalSlideIn 200ms ease-out",
          }}
        >
          {/* Banda dorada superior como acento de marca, igual que el card de login. */}
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-dy-gold-600) 0%, var(--color-dy-gold-400) 50%, var(--color-dy-gold-600) 100%)",
            }}
          />

          <div className="flex items-start justify-between gap-3 border-b px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {/* Cuerpo del modal */}
          <div className="px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}