// Pagina dedicada para crear un usuario nuevo.
// Formulario agrupado en 3 secciones: datos personales, contacto y acceso.
// Al guardar exitoso, redirige a /admin/usuarios y muestra toast.
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Save } from "lucide-react";
import {
  fechaMaximaParaMayorDeEdad,
  fechaMinimaNacimiento,
} from "@/lib/utils/fecha";

import {
  crearUsuarioSchema,
  type CrearUsuarioInput,
} from "@/lib/validators/usuario.schema";
import { evaluarCriterios } from "@/lib/validators/change-password.schema";
import { useCargos } from "@/lib/hooks/use-cargos";
import { useToast } from "@/lib/toast/use-toast";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { FormField, INPUT_CLASSES, INPUT_STYLE } from "@/components/ui/form-field";
import type { UsuarioListItem } from "@/lib/api/types/usuario.types";

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { cargos, isLoading: cargosLoading, error: cargosError } = useCargos();

  // Toggle del ojito en el campo password.
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CrearUsuarioInput>({
    resolver: zodResolver(crearUsuarioSchema),
    mode: "onBlur",
    defaultValues: {
      ci: "",
      paterno: "",
      materno: "",
      nombre: "",
      genero: undefined,
      fechaNacimiento: "",
      telefono: "",
      direccion: "",
      password: "",
      idCargos: [],
    },
  });

  // useWatch para reaccionar al array de idCargos sin warning de Compiler.
  const idCargosSeleccionados = useWatch({ control, name: "idCargos" }) ?? [];

  const onToggleCargo = (idCargo: number) => {
    // Si ya esta seleccionado, lo removemos. Si no, lo agregamos.
    const yaEsta = idCargosSeleccionados.includes(idCargo);
    const nuevoArray = yaEsta
      ? idCargosSeleccionados.filter((id) => id !== idCargo)
      : [...idCargosSeleccionados, idCargo];

    // setValue con shouldValidate: true para que zod re-valide el array.
    setValue("idCargos", nuevoArray, { shouldValidate: true });
  };

  const onSubmit = async (values: CrearUsuarioInput) => {
    // Construir el payload limpio: omitir campos opcionales vacios.
    // El backend acepta undefined/null en opcionales, pero string vacio  podria pasar la validacion @IsOptional dependiendo del DTO.
    const payload = {
      ci: values.ci,
      paterno: values.paterno,
      materno: values.materno || undefined,
      nombre: values.nombre,
      genero: values.genero,
      fechaNacimiento: values.fechaNacimiento || undefined,
      telefono: values.telefono || undefined,
      direccion: values.direccion || undefined,
      password: values.password,
      idCargos: values.idCargos,
    };

    try {
      const creado = await apiRequest<UsuarioListItem>(
        ENDPOINTS.admin.usuarios,
        { method: "POST", body: payload },
      );

      showToast(
        `Usuario ${creado.userName} creado correctamente.`,
        "success",
      );
      router.push("/admin/usuarios");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          err.messages[0] ?? "No se pudo crear el usuario.",
          "error",
        );
      } else {
        showToast("Error de red al crear el usuario.", "error");
      }
    }
  };

  // Calculamos los limites del input una sola vez por render.
  // No cambian durante la vida del componente (en la practica si cambian
  // al cruzar medianoche, es un edge case aceptable).
  const fechaMax = fechaMaximaParaMayorDeEdad();
  const fechaMin = fechaMinimaNacimiento();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb / boton volver */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/usuarios"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-muted"
          aria-label="Volver a la lista de usuarios"
          style={{
            borderColor: "var(--color-input)",
            color: "var(--color-foreground)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Crear nuevo usuario
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra un empleado y genera su cuenta de acceso al sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* SECCION 1: Datos personales */}
        <SeccionFormulario
          titulo="Datos personales"
          descripcion="Información del Empleado"
        >
          <FormField
            id="ci"
            label="Cédula de Identidad (CI):"
            required
            error={errors.ci?.message}
            helpText="Ej: 1234567 o 1234567-LP"
          >
            <input
              id="ci"
              type="text"
              autoComplete="off"
              disabled={isSubmitting}
              {...register("ci")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="paterno"
              label="Apellido Paterno:"
              required
              error={errors.paterno?.message}
            >
              <input
                id="paterno"
                type="text"
                disabled={isSubmitting}
                {...register("paterno")}
                className={INPUT_CLASSES}
                style={INPUT_STYLE}
              />
            </FormField>

            <FormField
              id="materno"
              label="Apellido Materno:"
              error={errors.materno?.message}
            >
              <input
                id="materno"
                type="text"
                disabled={isSubmitting}
                {...register("materno")}
                className={INPUT_CLASSES}
                style={INPUT_STYLE}
              />
            </FormField>
          </div>

          <FormField
            id="nombre"
            label="Nombre:"
            required
            error={errors.nombre?.message}
          >
            <input
              id="nombre"
              type="text"
              disabled={isSubmitting}
              {...register("nombre")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="genero"
              label="Género:"
              required
              error={errors.genero?.message}
            >
              <select
                id="genero"
                disabled={isSubmitting}
                {...register("genero")}
                className={INPUT_CLASSES}
                style={INPUT_STYLE}
              >
                <option value="">Selecciona...</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </FormField>

            <FormField
              id="fechaNacimiento"
              label="Fecha de Nacimiento:"
              error={errors.fechaNacimiento?.message}
              helpText="Debe ser mayor de 18 años"
            >
              <input
                id="fechaNacimiento"
                type="date"
                // min: limite inferior razonable (120 años atras).
                // max: la persona debe tener 18 anios cumplidos como minimo.
                // El navegador deshabilita visualmente las fechas fuera del rango, pero la validacion real corre en zod (defensa en profundidad).
                min={fechaMin}
                max={fechaMax}
                disabled={isSubmitting}
                {...register("fechaNacimiento")}
                className={INPUT_CLASSES}
                style={INPUT_STYLE}
              />
            </FormField>
          </div>
        </SeccionFormulario>

        {/* SECCION 2: Contacto */}
        <SeccionFormulario
          titulo="Datos de contacto"
          descripcion="Información opcional para localizar al empleado"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="telefono"
              label="Teléfono:"
              error={errors.telefono?.message}
            >
              <input
                id="telefono"
                type="tel"
                disabled={isSubmitting}
                {...register("telefono")}
                className={INPUT_CLASSES}
                style={INPUT_STYLE}
              />
            </FormField>

            <FormField
              id="direccion"
              label="Dirección:"
              error={errors.direccion?.message}
            >
              <input
                id="direccion"
                type="text"
                disabled={isSubmitting}
                {...register("direccion")}
                className={INPUT_CLASSES}
                style={INPUT_STYLE}
              />
            </FormField>
          </div>
        </SeccionFormulario>

        {/* SECCION 3: Acceso al sistema */}
        <SeccionFormulario
          titulo="Acceso al sistema"
          descripcion="Contraseña inicial y cargos asignados"
        >
          {/* Password con ojito + criterios */}
          <FormField
            id="password"
            label="Contraseña Inicial:"
            required
            error={errors.password?.message}
            helpText="El usuario podra cambiarla despues desde Mi Perfil"
          >
            <div className="relative">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register("password")}
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

          <IndicadorCriteriosPassword control={control} />

          {/* Selector multi de cargos */}
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Selecione los cargos a asignar:{" "}
              <span aria-hidden="true" className="text-red-600">
                *
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Una cuenta puede tener multiples cargos (ej: Jefe de Agencia
              tambien actua como Cajero)
            </p>

            {cargosLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando cargos disponibles...
              </div>
            ) : cargosError ? (
              <p className="mt-2 text-sm text-red-600">{cargosError}</p>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {cargos.map((cargo) => {
                  const seleccionado = idCargosSeleccionados.includes(
                    cargo.id,
                  );
                  return (
                    <button
                      key={cargo.id}
                      type="button"
                      onClick={() => onToggleCargo(cargo.id)}
                      disabled={isSubmitting}
                      className="rounded-md border p-3 text-left text-sm transition-colors disabled:opacity-60"
                      style={{
                        backgroundColor: seleccionado
                          ? "rgba(201, 162, 39, 0.15)"
                          : "var(--color-background)",
                        borderColor: seleccionado
                          ? "var(--color-dy-gold-500)"
                          : "var(--color-input)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{cargo.nombre}</span>
                        {seleccionado && (
                          <Check
                            className="h-4 w-4 shrink-0"
                            style={{ color: "var(--color-dy-gold-600)" }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      {cargo.descripcion && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cargo.descripcion}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {errors.idCargos && (
              <p className="mt-1 text-xs text-red-600">
                {errors.idCargos.message}
              </p>
            )}
          </div>
        </SeccionFormulario>

        {/* Botones de accion */}
        <div className="flex items-center justify-end gap-3 border-t pt-5">
          <Link
            href="/admin/usuarios"
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            style={{
              borderColor: "var(--color-input)",
              color: "var(--color-foreground)",
            }}
          >
            Cancelar
          </Link>
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
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Guardando..." : "Crear Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}

// =====================================================================
// Subcomponente: seccion del formulario con titulo y descripcion.
// =====================================================================
interface SeccionFormularioProps {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}

function SeccionFormulario({
  titulo,
  descripcion,
  children,
}: SeccionFormularioProps) {
  return (
    <section className="rounded-lg border bg-card p-6 text-card-foreground">
      <header className="mb-4">
        <h2 className="text-base font-semibold">{titulo}</h2>
        {descripcion && (
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// =====================================================================
// Subcomponente: indicador de criterios de password en tiempo real.
// Aislado en su propio componente con useWatch para no generar warning
// de React Compiler.
// =====================================================================
interface IndicadorCriteriosPasswordProps {
  control: Control<CrearUsuarioInput>;
}

function IndicadorCriteriosPassword({ control }: IndicadorCriteriosPasswordProps) {
  const password = useWatch({ control, name: "password" }) ?? "";

  if (password.length === 0) return null;

  const criterios = evaluarCriterios(password);

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