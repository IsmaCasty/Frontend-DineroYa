// Modal informativo que aparece cuando el backend devuelve 409 CATALOGO_EN_USO.
// Reutilizable entre TipoJoya y Kilate. No tiene boton de "forzar desactivar" ni nada de eso porque la regla del backend es estricta:
// si hay registros asociados activos, no se puede desactivar. Solo cerramos el modal.
"use client";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface CatalogoEnUsoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Nombre del item que se intentaba desactivar (ej: "ANILLO", "18 kilates").
  nombreItem: string;
  // Cantidad de registros asociados activos. Viene del body del 409.
  registrosAsociados: number;
  // Tipo de catalogo: cambia el sustantivo del mensaje.
  contexto: "tipo de joya" | "kilate";
}

export function CatalogoEnUsoModal({
  open,
  onOpenChange,
  nombreItem,
  registrosAsociados,
  contexto,
}: CatalogoEnUsoModalProps) {
  // Render condicional al cerrar: desmonta y resetea cualquier transicion.
  if (!open) return null;

  // Concordancia gramatical singular/plural.
  const sustantivo = registrosAsociados === 1 ? "joya" : "joyas";
  const verbo = registrosAsociados === 1 ? "esta asociada" : "estan asociadas";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="No se puede desactivar"
      size="sm"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="h-6 w-6 shrink-0 mt-0.5"
            style={{ color: "#ea580c" }}
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="text-sm">
              No se puede desactivar el {contexto}{" "}
              <strong>&quot;{nombreItem}&quot;</strong>.
            </p>
            <p className="text-sm">
              Hay <strong>{registrosAsociados}</strong> {sustantivo} activa
              {registrosAsociados === 1 ? "" : "s"} que {verbo} a este registro.
            </p>
            <p className="text-xs text-muted-foreground pt-2">
              Esta proteccion garantiza la integridad historica del sistema.
              Para desactivar este registro, primero debe quitar las
              asociaciones existentes.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-header-bg)",
              color: "white",
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}