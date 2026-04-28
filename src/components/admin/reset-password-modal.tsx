// Modal para que el admin resetee la contraseña de un usuario.
// Patron de "remontaje al cerrar": el componente real con el formulario
// (ResetPasswordModalContent) solo se monta cuando hay un usuario activo.
// Cuando el admin cierra el modal, el componente se desmonta y el state
// del formulario se descarta automaticamente. La proxima apertura crea
// una instancia nueva con defaultValues limpio. Sin useEffect, sin reset
// manual, sin warning de cascading renders.

"use client";

import { useState } from "react";
import {
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";

import { Modal } from "@/components/ui/modal";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/usuario.schema";
import { evaluarCriterios } from "@/lib/validators/change-password.schema";
import { useToast } from "@/lib/toast/use-toast";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  FormField,
  INPUT_CLASSES,
  INPUT_STYLE,
} from "@/components/ui/form-field";
import type { UsuarioListItem } from "@/lib/api/types/usuario.types";

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioListItem | null;
}

// Componente publico que solo decide si renderizar el contenido o no.
// Si no hay usuario o el modal esta cerrado, NO se monta el contenido,
// y el form interno se descarta. Asi nos ahorramos el useEffect de reset.
export function ResetPasswordModal({
  open,
  onOpenChange,
  usuario,
}: ResetPasswordModalProps) {
  // Solo montar el contenido cuando hay usuario Y el modal esta abierto.
  // Cuando se cierra, el componente hijo se desmonta y descarta su state.
  if (!open || !usuario) {
    // Aun asi, montamos un Modal "vacio" con open=false para que Radix
    // pueda manejar la animacion de salida la primera vez. Como open
    // es false, no se renderiza nada visible.
    return (
      <Modal
        open={false}
        onOpenChange={onOpenChange}
        title=""
        size="md"
      >
        <></>
      </Modal>
    );
  }

  return (
    <ResetPasswordModalContent
      onOpenChange={onOpenChange}
      usuario={usuario}
    />
  );
}

// Contenido real del modal con el formulario. Se monta y desmonta segun
// el estado del padre. Cada montaje crea un useForm fresco con
// defaultValues limpio. NO necesita useEffect para resetear.
interface ResetPasswordModalContentProps {
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioListItem;
}

function ResetPasswordModalContent({
  onOpenChange,
  usuario,
}: ResetPasswordModalContentProps) {
  const { showToast } = useToast();
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: { newPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      await apiRequest<{ message: string }>(
        ENDPOINTS.admin.resetPassword(usuario.idCuenta),
        { method: "PUT", body: { newPassword: values.newPassword } },
      );

      showToast(
        `Contraseña reseteada para ${usuario.userName}. Sus sesiones activas fueron cerradas.`,
        "success",
      );
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          err.messages[0] ?? "No se pudo resetear la contraseña.",
          "error",
        );
      } else {
        showToast("Error de red al resetear la contraseña.", "error");
      }
    }
  };

  return (
    <Modal
      open={true}
      onOpenChange={onOpenChange}
      title="Resetear contraseña"
      description={`${usuario.nombreCompleto} (${usuario.userName})`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Aviso importante de seguridad */}
        <div
          role="alert"
          className="flex gap-3 rounded-md border p-3"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderColor: "rgba(245, 158, 11, 0.4)",
          }}
        >
          <AlertTriangle
            className="h-5 w-5 shrink-0"
            style={{ color: "#b45309" }}
            aria-hidden="true"
          />
          <div className="text-xs" style={{ color: "#92400e" }}>
            <p className="font-semibold">
              Esta accion cerrara todas las sesiones activas del usuario.
            </p>
            <p className="mt-1">
              Comunica la nueva contraseña al usuario por un canal seguro.
            </p>
          </div>
        </div>

        <FormField
          id="newPassword"
          label="Nueva contraseña"
          required
          error={errors.newPassword?.message}
        >
          <div className="relative">
            <input
              id="newPassword"
              type={mostrarPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register("newPassword")}
              className={`${INPUT_CLASSES} pr-10`}
              style={INPUT_STYLE}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setMostrarPassword((v) => !v)}
              aria-label={
                mostrarPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {mostrarPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </FormField>

        <IndicadorCriterios control={control} />

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            style={{
              borderColor: "var(--color-input)",
              color: "var(--color-foreground)",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: "var(--color-dy-gold-500)",
            }}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {isSubmitting ? "Reseteando..." : "Resetear contraseña"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Indicador de criterios. useWatch para evitar warning de Compiler.
function IndicadorCriterios({
  control,
}: {
  control: Control<ResetPasswordInput>;
}) {
  const password = useWatch({ control, name: "newPassword" }) ?? "";

  if (password.length === 0) return null;

  const criterios = evaluarCriterios(password);

  return (
    <ul className="space-y-1 rounded-md border p-3 text-xs">
      {criterios.map((c, i) => (
        <li
          key={i}
          className="flex items-center gap-2"
          style={{
            color: c.cumple ? "#16a34a" : "var(--color-muted-foreground)",
          }}
        >
          {c.cumple ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "currentColor" }}
              aria-hidden="true"
            />
          )}
          <span>{c.texto}</span>
        </li>
      ))}
    </ul>
  );
}