// Formulario de cambio de contrasenia propia (RF-06).
// Usa useWatch (no watch) para evitar warning del React Compiler.
// Usa apiRequest con body como objeto plano (apiRequest hace stringify).
// El subcomponente CampoPassword tipa register con UseFormRegisterReturn,
// que es el tipo oficial que expone react-hook-form para este patron.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useWatch,
  type Control,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  changePasswordSchema,
  evaluarCriterios,
  type ChangePasswordInput,
} from "@/lib/validators/change-password.schema";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/lib/toast/use-toast";
import { apiRequest, ApiError } from "@/lib/api/client";

// URL del endpoint. Si tu archivo de endpoints expone una constante,
// reemplaza este string por ENDPOINTS.auth.changePassword.
const CHANGE_PASSWORD_PATH = "/auth/change-password";

export function ChangePasswordForm() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordInput) => {
    setErrorBackend(null);
    setEnviando(true);

    try {
      // apiRequest stringifica el body internamente, le pasamos objeto plano.
      // El backend espera solo currentPassword + newPassword.
      await apiRequest(CHANGE_PASSWORD_PATH, {
        method: "PUT",
        body: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });

      showToast(
        "Contraseña actualizada. Inicia sesion nuevamente.",
        "success",
      );

      // 1.2s para que el usuario lea el toast antes del redirect.
      window.setTimeout(() => {
        void logout().then(() => {
          router.push("/login");
        });
      }, 1200);
    } catch (err) {
      // ApiError tiene statusCode (no status) y messages: string[].
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setErrorBackend("La contraseña actual es incorrecta");
        } else if (err.messages.length > 0) {
          setErrorBackend(err.messages.join(" "));
        } else {
          setErrorBackend(
            "No se pudo cambiar la contraseña. Intenta nuevamente.",
          );
        }
      } else {
        setErrorBackend("Error de red. Verifica tu conexión.");
      }
      setEnviando(false);
    }
    // En exito NO ponemos setEnviando(false): el boton sigue deshabilitado durante el redirect.
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <CampoPassword
        id="currentPassword"
        label="Contraseña actual:"
        register={register("currentPassword")}
        error={errors.currentPassword?.message}
        autoComplete="current-password"
        mostrar={mostrarActual}
        toggleMostrar={() => setMostrarActual((v) => !v)}
        disabled={enviando}
        placeholder="Ingrese su contraseña actual"
      />

      <div>
        <CampoPassword
          id="newPassword"
          label="Nueva contraseña:"
          register={register("newPassword")}
          error={errors.newPassword?.message}
          autoComplete="new-password"
          mostrar={mostrarNueva}
          toggleMostrar={() => setMostrarNueva((v) => !v)}
          disabled={enviando}
          placeholder="Ingrese su nueva contraseña con los criterios indicados"
        />

        <IndicadorCriterios control={control} />
      </div>

      <CampoPassword
        id="confirmPassword"
        label="Confirmar nueva contraseña:"
        register={register("confirmPassword")}
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
        mostrar={mostrarConfirm}
        toggleMostrar={() => setMostrarConfirm((v) => !v)}
        disabled={enviando}
        placeholder="Repita su nueva contraseña"
      />

      {errorBackend && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorBackend}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center text-foreground gap-2 rounded-md py-2.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        style={{  
          backgroundColor: "var(--color-dy-gold-500)",
        }}
        onMouseEnter={(e) => {
          if (!enviando) {
            e.currentTarget.style.backgroundColor = "var(--color-dy-gold-600)";
          }
        }}
        onMouseLeave={(e) => {
          if (!enviando) {
            e.currentTarget.style.backgroundColor = "var(--color-dy-gold-500)";
          }
        }}
      >
        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
        {enviando ? "Cambiando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

// =====================================================================
// Subcomponente: indicador de criterios de la nueva contrasenia.
// useWatch suscribe al campo y solo re-renderiza este componente.
// =====================================================================
interface IndicadorCriteriosProps {
  control: Control<ChangePasswordInput>;
}

function IndicadorCriterios({ control }: IndicadorCriteriosProps) {
  const passwordNueva = useWatch({ control, name: "newPassword" }) ?? "";

  if (passwordNueva.length === 0) return null;

  const criterios = evaluarCriterios(passwordNueva);

  return (
    <ul className="mt-2 space-y-1 rounded-md border p-3 text-xs">
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

// =====================================================================
// Subcomponente: campo de password con label, ojito y error.
// El prop register usa UseFormRegisterReturn, el tipo oficial que
// react-hook-form expone para el resultado de register("nombreCampo").
// =====================================================================
interface CampoPasswordProps {
  id: string;
  label: string;
  // Tipo oficial que retorna register(name). Es generico en el nombre del
  // campo para mantener inferencia de tipos cuando se usa en formularios
  // mas grandes. Aqui aceptamos cualquier nombre de campo string.
  register: UseFormRegisterReturn;
  error?: string;
  autoComplete: string;
  mostrar: boolean;
  toggleMostrar: () => void;
  disabled: boolean;
  placeholder: string;
}
// El placeholder se lo pasamos desde el padre, asi el componente es mas reutilizable y no tiene hardcodeada la logica de "contraseña actual" vs "nueva contraseña". 
// El padre decide que placeholder mostrar segun el caso de uso.
function CampoPassword({
  id,
  label,
  register,
  error,
  autoComplete,
  mostrar,
  toggleMostrar,
  disabled,
  placeholder,
}: CampoPasswordProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium"
        style={{ color: "var(--color-foreground)" }}
      >
        {label}
      </label>

      <div className="relative mt-1">
        <input
          id={id}
          type={mostrar ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          {...register}
          className="block w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-1 disabled:opacity-60"
          placeholder={placeholder}
          style={{
            backgroundColor: "var(--color-background)",
            borderColor: "var(--color-input)",
            color: "var(--color-foreground)",
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={toggleMostrar}
          aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {mostrar ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}