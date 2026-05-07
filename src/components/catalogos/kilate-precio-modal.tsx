// Modal especifico del endpoint /precio-gramo. Lo ven Admin y Jefa.
// La Jefa lo usa semanalmente cuando el precio del oro en el mercado cambia. Es mas simple que el modal completo: solo un campo.
// Mostramos el precio actual como referencia para que la Jefa sepa cuanto esta cambiando.
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField, INPUT_CLASSES, INPUT_STYLE } from "@/components/ui/form-field";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import {
  kilatePrecioSchema,
  type KilatePrecioFormData,
} from "@/lib/validators/kilate.schema";
import type { Kilate } from "@/lib/api/types/catalogo.types";

interface KilatePrecioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kilate: Kilate;
  onExito: (kilate: Kilate) => void;
}

export function KilatePrecioModal(props: KilatePrecioModalProps) {
  if (!props.open) return null;
  return <KilatePrecioModalContent {...props} />;
}

function KilatePrecioModalContent({
  open,
  onOpenChange,
  kilate,
  onExito,
}: KilatePrecioModalProps) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KilatePrecioFormData>({
    resolver: zodResolver(kilatePrecioSchema),
    defaultValues: {
      precioGramo: kilate.precioGramo,
    },
  });

  const onSubmit = async (data: KilatePrecioFormData) => {
    try {
      const resultado = await apiRequest<Kilate>(
        ENDPOINTS.catalogos.kilatePrecio(kilate.id),
        { method: "PATCH", body: { precioGramo: data.precioGramo } },
      );
      showToast(
        `Precio del kilate ${kilate.kilate}k actualizado a Bs ${data.precioGramo.toFixed(2)}/gr.`,
        "success",
      );
      onExito(resultado);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.messages[0] ?? "No se pudo actualizar el precio.", "error");
      } else {
        showToast("Error de red al actualizar el precio.", "error");
      }
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Actualizar precio — ${kilate.kilate}k`}
      description="Solo se actualiza el precio por gramo. El kilate no cambia."
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
        {/* Precio actual como referencia visual antes de confirmar el cambio */}
        <div
          className="rounded-md p-3 text-sm"
          style={{
            backgroundColor: "var(--color-background-secondary)",
            borderLeft: "3px solid var(--color-header-accent)",
          }}
        >
          <span style={{ color: "var(--color-muted-foreground)" }}>
            Precio actual:{" "}
          </span>
          <strong>Bs {kilate.precioGramo.toFixed(2)} / g</strong>
        </div>

        <FormField
          id="precioGramo"
          label="Nuevo precio por gramo (Bs)"
          required
          error={errors.precioGramo?.message}
        >
          <input
            id="precioGramo"
            type="number"
            min={0.01}
            step={0.01}
            disabled={isSubmitting}
            autoFocus
            {...register("precioGramo", { valueAsNumber: true })}
            className={INPUT_CLASSES}
            style={INPUT_STYLE}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            style={{ borderColor: "var(--color-border)" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-header-accent)" }}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Actualizar precio
          </button>
        </div>
      </form>
    </Modal>
  );
}