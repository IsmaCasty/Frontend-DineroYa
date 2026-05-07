// Modal de CRUD completo del kilate: kilate numerico + precioGramo.
// Solo Admin lo usa. Modo alta si no recibe kilate, modo edicion si si.
// Los inputs type="number" con RHF requieren valueAsNumber en register para que zod reciba number y no string,
// porque HTML siempre devuelve strings desde los inputs aunque el type sea number.
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField, INPUT_CLASSES, INPUT_STYLE } from "@/components/ui/form-field";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { kilateSchema, type KilateFormData } from "@/lib/validators/kilate.schema";
import type { Kilate } from "@/lib/api/types/catalogo.types";

interface KilateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kilate?: Kilate;
  onExito: (kilate: Kilate) => void;
}

export function KilateModal(props: KilateModalProps) {
  if (!props.open) return null;
  return <KilateModalContent {...props} />;
}

function KilateModalContent({ open, onOpenChange, kilate, onExito }: KilateModalProps) {
  const { showToast } = useToast();
  const esEdicion = !!kilate;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KilateFormData>({
    resolver: zodResolver(kilateSchema),
    defaultValues: {
      kilate: kilate?.kilate ?? (undefined as unknown as number),
      precioGramo: kilate?.precioGramo ?? (undefined as unknown as number),
    },
  });

  const onSubmit = async (data: KilateFormData) => {
    try {
      let resultado: Kilate;
      if (esEdicion && kilate) {
        resultado = await apiRequest<Kilate>(
          ENDPOINTS.catalogos.kilate(kilate.id),
          { method: "PATCH", body: data },
        );
        showToast("Kilate actualizado correctamente.", "success");
      } else {
        resultado = await apiRequest<Kilate>(
          ENDPOINTS.catalogos.kilates,
          { method: "POST", body: data },
        );
        showToast("Kilate creado correctamente.", "success");
      }
      onExito(resultado);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.messages[0] ?? "Ocurrio un error.", "error");
      } else {
        showToast("Error de red al guardar.", "error");
      }
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={esEdicion ? "Editar kilate" : "Nuevo kilate"}
      description={
        esEdicion
          ? `Modificando el kilate ${kilate?.kilate}k.`
          : "Completa los datos para registrar un nuevo kilate."
      }
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
        <FormField
          id="kilate"
          label="Kilate"
          required
          error={errors.kilate?.message}
          helpText="Valor entero (ej: 14, 18, 24)."
        >
          <input
            id="kilate"
            type="number"
            min={1}
            max={24}
            step={1}
            disabled={isSubmitting || esEdicion}
            autoFocus={!esEdicion}
            // valueAsNumber: RHF convierte el string del input a number antes de pasarlo al resolver. Sin esto zod recibe string y falla.
            {...register("kilate", { valueAsNumber: true })}
            className={INPUT_CLASSES}
            style={{
              ...INPUT_STYLE,
              // En edicion el kilate no se puede cambiar (es el identificador del tipo de oro). Visual de deshabilitado mas explicito.
              opacity: esEdicion ? 0.6 : 1,
              cursor: esEdicion ? "not-allowed" : "text",
            }}
          />
        </FormField>

        <FormField
          id="precioGramo"
          label="Precio por gramo (Bs):"
          required
          error={errors.precioGramo?.message}
          helpText="Precio en bolivianos por gramo de oro de este kilate."
        >
          <input
            id="precioGramo"
            type="number"
            min={0.01}
            step={0.01}
            disabled={isSubmitting}
            autoFocus={esEdicion}
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
            {esEdicion ? "Guardar cambios" : "Crear kilate"}
          </button>
        </div>
      </form>
    </Modal>
  );
}