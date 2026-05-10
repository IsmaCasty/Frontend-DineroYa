// Modal de anulacion de contrato (RF-27).
// El reset del formulario ocurre por unmounting: cuando open === false el componente retorna null, desmontandose y limpiando el estado.
// useWatch para mostrar/ocultar descripcionOtro segun el motivo seleccionado.
// superRefine con ctx.addIssue() para la validacion condicional dinamica.
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import type { MotivoAnulacion } from "@/lib/api/types/contrato.types";

// superRefine: validacion DINAMICA (mensaje depende del valor de otro campo)
// Esta es la diferencia con refine estatico: aqui la logica condicional
// no puede expresarse en un static config object.
const anularSchema = z.object({
  motivo: z.enum(
    ["ERROR_MONTO", "CLIENTE_INCORRECTO", "DUPLICADO", "OTRO"],
    { message: "Selecciona un motivo" }
  ),
  descripcionOtro: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.motivo === "OTRO") {
    if (!data.descripcionOtro || !data.descripcionOtro.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["descripcionOtro"],
        message: "Describe el motivo de la anulacion",
      });
    } else if (data.descripcionOtro.trim().length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["descripcionOtro"],
        message: "El motivo debe tener al menos 5 caracteres",
      });
    }
  }
});

type AnularFormValues = z.infer<typeof anularSchema>;

const MOTIVOS: { value: MotivoAnulacion; label: string }[] = [
  { value: "ERROR_MONTO", label: "Error de monto" },
  { value: "CLIENTE_INCORRECTO", label: "Cliente incorrecto" },
  { value: "DUPLICADO", label: "Contrato duplicado" },
  { value: "OTRO", label: "Otro motivo" },
];

interface ModalAnularContratoProps {
  open: boolean;
  contratoId: number;
  nroContrato: string;
  onClose: () => void;
  onAnulado: () => void;
}

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const selectClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function ModalAnularContrato({
  open,
  contratoId,
  nroContrato,
  onClose,
  onAnulado,
}: ModalAnularContratoProps) {
  // Retornar null desmonta el componente y resetea el form automaticamente.
  // Nunca usar useEffect + reset() para este patron.
  if (!open) return null;

  return (
    <ModalAnularContratoInner
      contratoId={contratoId}
      nroContrato={nroContrato}
      onClose={onClose}
      onAnulado={onAnulado}
    />
  );
}

// Componente interno separado para que useForm se inicialice fresco cada vez que el modal se abre (por el unmounting del padre).
function ModalAnularContratoInner({
  contratoId,
  nroContrato,
  onClose,
  onAnulado,
}: Omit<ModalAnularContratoProps, "open">) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AnularFormValues>({
    resolver: zodResolver(anularSchema),
    defaultValues: { motivo: "ERROR_MONTO", descripcionOtro: "" },
  });

  // useWatch (no watch()): muestra el textarea de descripcion solo si es OTRO
  const motivoActual = useWatch({ control, name: "motivo" });

  const onSubmit = async (values: AnularFormValues) => {
    type Resp = { message: string };
    try {
        await apiRequest<Resp>(ENDPOINTS.contratos.anular(contratoId), {
            method: "POST",
            body: {
                motivo: values.motivo,
                descripcionOtro:
                values.motivo === "OTRO" ? values.descripcionOtro : undefined,
            },  // objeto directo, sin JSON.stringify
        });
      showToast(`Contrato ${nroContrato} anulado correctamente`, "success");
      onAnulado();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al anular el contrato";
      showToast(msg, "error");
    }
  };

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Anular contrato
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {nroContrato} — Esta accion no se puede deshacer.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Motivo */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Motivo de anulación <span className="text-red-500">*</span>
              </label>
              <select
                {...register("motivo")}
                className={selectClass}
                aria-invalid={!!errors.motivo}
              >
                {MOTIVOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.motivo && (
                <p className={errorClass}>{errors.motivo.message}</p>
              )}
            </div>

            {/* Descripcion: solo visible si el motivo es OTRO */}
            {motivoActual === "OTRO" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Descripción del motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("descripcionOtro")}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Explica brevemente el motivo..."
                  maxLength={200}
                  aria-invalid={!!errors.descripcionOtro}
                />
                {errors.descripcionOtro && (
                  <p className={errorClass}>{errors.descripcionOtro.message}</p>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#dc2626" }}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirmar anulación
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}