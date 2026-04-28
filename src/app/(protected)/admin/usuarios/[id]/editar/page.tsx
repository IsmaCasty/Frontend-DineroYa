// Pagina dedicada para editar datos de un usuario existente.
// Usa un tipo intermedio UsuarioConEmpleado para evitar ambiguedad de
// genericos en JSX (cuando escribes apiRequest<Tipo>(), el parser puede
// confundir < con apertura de tag).
"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
  fechaMaximaParaMayorDeEdad,
  fechaMinimaNacimiento,
} from "@/lib/utils/fecha";

import {
  editarUsuarioSchema,
  type EditarUsuarioInput,
} from "@/lib/validators/usuario.schema";
import { useToast } from "@/lib/toast/use-toast";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  FormField,
  INPUT_CLASSES,
  INPUT_STYLE,
} from "@/components/ui/form-field";
import { construirPayloadDiff } from "@/lib/utils/diff-payload";
import type { UsuarioListItem } from "@/lib/api/types/usuario.types";

// Tipo del detalle del empleado que devuelve obtenerDetalleParaEdicion.
// Coincide con el shape del backend (ver usuario.service.ts).
interface EmpleadoDetalle {
  paterno: string;
  materno: string;
  nombre: string;
  genero: "M" | "F";
  fechaNacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
}

// Tipo combinado: lo que devuelve el endpoint GET /admin/usuarios/:id.
// Lo declaramos APARTE del apiRequest para evitar la ambiguedad de genericos < ... > dentro de archivos .tsx (JSX parser issue).
type UsuarioConEmpleado = UsuarioListItem & {
  empleado: EmpleadoDetalle;
};

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idCuenta = Number(params.id);

  const { showToast } = useToast();

  // Datos originales para construir el diff al guardar.
  const [original, setOriginal] = useState<EditarUsuarioInput | null>(null);
  const [usuarioInfo, setUsuarioInfo] = useState<{
    userName: string;
    nombreCompleto: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditarUsuarioInput>({
    resolver: zodResolver(editarUsuarioSchema),
    mode: "onBlur",
  });

  // Carga inicial del usuario. useEffect aqui es legitimo: fetch al backend. setState dentro de callback async, no sincronicamente en el body.
  useEffect(() => {
    const cargar = async () => {
      setIsLoading(true);
      setErrorCarga(null);
      try {
        // Tipamos el generico con UsuarioConEmpleado declarado arriba.
        // Esto evita la ambiguedad de < ... > en archivos .tsx.
        const data = await apiRequest<UsuarioConEmpleado>(
          ENDPOINTS.admin.usuario(idCuenta),
        );

        setUsuarioInfo({
          userName: data.userName,
          nombreCompleto: data.nombreCompleto,
        });

        const valoresIniciales: EditarUsuarioInput = {
          ci: data.ci,
          paterno: data.empleado.paterno,
          materno: data.empleado.materno,
          nombre: data.empleado.nombre,
          genero: data.empleado.genero,
          fechaNacimiento: data.empleado.fechaNacimiento ?? "",
          telefono: data.empleado.telefono ?? "",
          direccion: data.empleado.direccion ?? "",
          estado: data.estado,
        };

        setOriginal(valoresIniciales);
        reset(valoresIniciales);
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorCarga(err.messages[0] ?? "No se pudo cargar el usuario.");
        } else {
          setErrorCarga("Error de red al cargar el usuario.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void cargar();
  }, [idCuenta, reset]);

  const onSubmit = async (values: EditarUsuarioInput) => {
    if (!original) return;

    const diff = construirPayloadDiff(original, values);

    if (Object.keys(diff).length === 0) {
      showToast("No hay cambios para guardar.", "info");
      return;
    }

    try {
      await apiRequest<UsuarioListItem>(ENDPOINTS.admin.usuario(idCuenta), {
        method: "PUT",
        body: diff,
      });

      showToast("Usuario actualizado correctamente.", "success");
      router.push("/admin/usuarios");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          err.messages[0] ?? "No se pudo actualizar el usuario.",
          "error",
        );
      } else {
        showToast("Error de red al actualizar.", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-700"
        >
          <p className="font-medium">No se pudo cargar el usuario</p>
          <p className="mt-1">{errorCarga}</p>
          <Link
            href="/admin/usuarios"
            className="mt-3 inline-block rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Volver a la lista
          </Link>
        </div>
      </div>
    );
  }

  // Calculamos los limites del input una sola vez por render.
  // No cambian durante la vida del componente (en la practica si cambian
  // al cruzar medianoche, es un edge case aceptable).
  const fechaMax = fechaMaximaParaMayorDeEdad();
  const fechaMin = fechaMinimaNacimiento();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/usuarios"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-muted"
          aria-label="Volver"
          style={{
            borderColor: "var(--color-input)",
            color: "var(--color-foreground)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar usuario</h1>
          <p className="text-sm text-muted-foreground">
            {usuarioInfo?.nombreCompleto}{" "}
            <span className="font-mono text-xs">
              ({usuarioInfo?.userName})
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <section className="rounded-lg border bg-card p-6 text-card-foreground">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Datos personales</h2>
          </header>
          <div className="space-y-4">
            <FormField
              id="ci"
              label="Cédula de Identidad (CI):"
              error={errors.ci?.message}
            >
              <input
                id="ci"
                type="text"
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
                  // min: limite inferior razonable (120 anios atras).
                  // max: la persona debe tener 18 anios cumplidos como minimo.
                  // El navegador deshabilita visualmente las fechas fuera del rango,
                  // pero la validacion real corre en zod (defensa en profundidad).
                  min={fechaMin}
                  max={fechaMax}
                  disabled={isSubmitting}
                  {...register("fechaNacimiento")}
                  className={INPUT_CLASSES}
                  style={INPUT_STYLE}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 text-card-foreground">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Datos de contacto</h2>
          </header>
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
        </section>

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
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}