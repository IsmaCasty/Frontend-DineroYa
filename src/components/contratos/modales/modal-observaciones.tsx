// Modal para agregar o editar la observacion interna de un contrato (RF-29).
// Solo accesible para Jefa y Admin. Sigue el mismo patron de unmounting para reset del formulario: if (!open) return null.
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const obsSchema = z.object({
  observaciones: z
    .string()
    .min(3, "La observacion debe tener al menos 3 caracteres")
    .max(300, "Maximo 300 caracteres"),
});

type ObsFormValues = z.infer<typeof obsSchema>;

interface ModalObservacionesProps {
  open: boolean;
  contratoId: number;
  nroContrato: string;
  // Observacion actual para pre-rellenar el formulario
  observacionActual?: string | null;
  onClose: () => void;
  onGuardado: (nuevaObs: string) => void;
}

export function ModalObservaciones({
  open,
  contratoId,
  nroContrato,
  observacionActual,
  onClose,
  onGuardado,
}: ModalObservacionesProps) {
  if (!open) return null;

  return (
    <ModalObservacionesInner
      contratoId={contratoId}
      nroContrato={nroContrato}
      observacionActual={observacionActual}
      onClose={onClose}
      onGuardado={onGuardado}
    />
  );
}

function ModalObservacionesInner({
  contratoId,
  nroContrato,
  observacionActual,
  onClose,
  onGuardado,
}: Omit<ModalObservacionesProps, "open">) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObsFormValues>({
    resolver: zodResolver(obsSchema),
    // Pre-rellena con la observacion existente si la hay
    defaultValues: { observaciones: observacionActual ?? "" },
  });

  const onSubmit = async (values: ObsFormValues) => {
    type Resp = { message: string };
    try {
        await apiRequest<Resp>(ENDPOINTS.contratos.observaciones(contratoId), {
            method: "PATCH",
            body: { observaciones: values.observaciones },  // objeto directo
        });
      showToast("Observacion guardada correctamente", "success");
      onGuardado(values.observaciones);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al guardar la observacion";
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
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Observacion interna
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Contrato {nroContrato}. Solo visible para Jefa y Admin.
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
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Observacion <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("observaciones")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={4}
                placeholder="Notas internas del contrato..."
                maxLength={300}
                aria-invalid={!!errors.observaciones}
                autoFocus
              />
              {errors.observaciones && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.observaciones.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1">
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
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#1a3a1a" }}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar observación
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}