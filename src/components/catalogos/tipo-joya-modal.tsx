// Modal dual: si recibe tipoJoya = modo edicion, si no recibe = modo alta.
// El truco para resetear el form al cerrar es el render condicional con "if (!open) return null" en el wrapper.
// Cuando se cierra, todo el subarbol se desmonta, incluyendo el useForm. En el siguiente abrir, el hook se
// monta limpio con los defaultValues correctos. Esto evita useEffect+reset.
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  FormField,
  INPUT_CLASSES,
  INPUT_STYLE,
} from "@/components/ui/form-field";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import {
  tipoJoyaSchema,
  type TipoJoyaFormData,
} from "@/lib/validators/tipo-joya.schema";
import type { TipoJoya } from "@/lib/api/types/catalogo.types";

interface TipoJoyaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Si esta presente, modo edicion. Si no, modo alta.
  tipoJoya?: TipoJoya;
  // Callback con el resultado del backend. El padre lo usa para upsertLocal.
  onExito: (tipo: TipoJoya) => void;
}

export function TipoJoyaModal(props: TipoJoyaModalProps) {
  // Wrapper con render condicional. Garantiza que el form se desmonte cuando se cierra el modal, evitando estado residual.
  if (!props.open) return null;
  return <TipoJoyaModalContent {...props} />;
}

// Componente interno: aqui vive toda la logica del form. Solo se monta cuando el modal esta abierto, lo que resetea defaults automaticamente.
function TipoJoyaModalContent({
  open,
  onOpenChange,
  tipoJoya,
  onExito,
}: TipoJoyaModalProps) {
  const { showToast } = useToast();
  const esEdicion = !!tipoJoya;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TipoJoyaFormData>({
    resolver: zodResolver(tipoJoyaSchema),
    defaultValues: {
      // Si es edicion, precargamos. Si es alta, vacio.
      descripcion: tipoJoya?.descripcion ?? "",
    },
  });

  const onSubmit = async (data: TipoJoyaFormData) => {
    try {
      let resultado: TipoJoya;
      if (esEdicion && tipoJoya) {
        // PATCH parcial: solo descripcion.
        resultado = await apiRequest<TipoJoya>(
          ENDPOINTS.catalogos.tipoJoya(tipoJoya.id),
          {
            method: "PATCH",
            body: { descripcion: data.descripcion },
          },
        );
        showToast("Tipo de joya actualizado correctamente.", "success");
      } else {
        // POST: el backend devuelve el objeto recien creado.
        resultado = await apiRequest<TipoJoya>(
          ENDPOINTS.catalogos.tiposJoya,
          {
            method: "POST",
            body: { descripcion: data.descripcion },
          },
        );
        showToast("Tipo de joya creado correctamente.", "success");
      }
      // Notificar al padre con el objeto del backend (ya con id real,
      // descripcion en mayusculas por el subscriber, etc.)
      onExito(resultado);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        // El backend ya manda mensaje claro en err.messages para 409 duplicado
        // y para 400 validation. Lo mostramos directo en el toast.
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
      title={esEdicion ? "Editar tipo de joya" : "Nuevo tipo de joya"}
      description={
        esEdicion
          ? `Modificando "${tipoJoya?.descripcion}".`
          : "Completa los datos para crear un nuevo tipo de joya."
      }
      size="sm"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="p-6 space-y-4"
      >
        <FormField
          id="descripcion"
          label="Nombre del tipo de joya:"
          required
          error={errors.descripcion?.message}
          helpText="(ej: ANILLO, ARETE, PULSERA)."
        >
          <input
            id="descripcion"
            type="text"
            disabled={isSubmitting}
            autoComplete="off"
            autoFocus
            maxLength={50}
            {...register("descripcion")}
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
            style={{
              borderColor: "var(--color-border)",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-header-accent)",
            }}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {esEdicion ? "Guardar cambios" : "Crear tipo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}