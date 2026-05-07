// Formulario reutilizable para alta y edicion de clientes.
// Se divide en cuatro secciones agrupadas con el patron de Sprint 1:
// 1. Identificacion (tipoDocumento, ci)
// 2. Datos personales (nombre, apellidos, genero, nacimiento, nacionalidad)
// 3. Contacto (telefono, nit, direccion)
// 4. Ubicacion (localidad en cascada -> zona)

// El selector localidad->zona usa useWatch para reaccionar al cambio de localidad sin useEffect. 
// Cuando localidad cambia, reseteamos idZona a null via setValue (unico caso donde setValue es correcto: resetear
// un campo dependiente en cascada, no sincronizar estado con estado).
"use client";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { FormField, INPUT_CLASSES, INPUT_STYLE } from "@/components/ui/form-field";
import { useLocalidades } from "@/lib/hooks/use-localidades";
import { clienteSchema, type ClienteFormData } from "@/lib/validators/cliente.schema";

interface ClienteFormProps {
  // Valores iniciales. En alta: undefined. En edicion: datos del cliente.
  defaultValues?: Partial<ClienteFormData>;
  // Texto del boton de submit.
  labelSubmit: string;
  // Se llama con los datos validados por zod. El padre maneja el request.
  // Cambiar la firma de onSubmit en la interfaz ClienteFormProps:
onSubmit: (
  data: ClienteFormData,
  dirtyFields: Partial<Record<keyof ClienteFormData, boolean>>,
) => Promise<void>;
  // Para volver atras sin guardar.
  onCancelar: () => void;
}

export function ClienteForm({
  defaultValues,
  labelSubmit,
  onSubmit,
  onCancelar,
}: ClienteFormProps) {
  const { localidades, zonasPorLocalidad } = useLocalidades();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipoDocumento: "CI",
      genero: "",
      ...defaultValues,
    },
  });

  // useWatch para reaccionar al cambio de localidad sin useEffect + setState.
  // React Compiler recomienda useWatch en lugar de watch() para evitar  re-renders innecesarios en componentes funcionales.
  const idLocalidadWatch = useWatch({ control, name: "idLocalidad" });
  const tipoDocWatch = useWatch({ control, name: "tipoDocumento" });

  // Zonas disponibles segun la localidad seleccionada.
  const zonasDisponibles = zonasPorLocalidad(idLocalidadWatch ?? null);

  // Cuando cambia la localidad, reseteamos la zona porque las zonas anteriores ya no son validas. setValue es el mecanismo correcto
  // aqui: no estamos sincronizando estado con estado, estamos reseteando un campo dependiente en cascada (caso legitimado por RHF).
  // Sin este useEffect, el usuario podria cambiar localidad y que la zona anterior (de otra localidad) quede seleccionada silenciosamente.
  useEffect(() => {
    setValue("idZona", null);
  // Solo queremos ejecutar esto cuando cambia la localidad, no en otros renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLocalidadWatch]);

  const seccionClass = "rounded-lg border bg-card p-6 text-card-foreground space-y-4";
  const headerSeccionClass = "text-base font-semibold mb-4";

  return (
      <form
        onSubmit={handleSubmit(async (data) => {
          await onSubmit(data, dirtyFields as Partial<Record<keyof ClienteFormData, boolean>>);
        })}
        noValidate
        className="space-y-6"
      >
      {/* Seccion 1: Identificacion */}
      <section className={seccionClass}>
        <h2 className={headerSeccionClass}>Identificacion</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="tipoDocumento"
            label="Tipo de Documento:"
            required
            error={errors.tipoDocumento?.message}
          >
            <select
              id="tipoDocumento"
              disabled={isSubmitting}
              {...register("tipoDocumento")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            >
              <option value="CI">Cédula de Identidad (CI)</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="RUN">RUN (Chile)</option>
            </select>
          </FormField>

          <FormField
            id="ci"
            label={
              tipoDocWatch === "CI"
                ? "Numero de CI"
                : tipoDocWatch === "PASAPORTE"
                ? "Numero de pasaporte"
                : "RUN"
            }
            required
            error={errors.ci?.message}
            helpText={
              tipoDocWatch === "CI"
                ? "Solo digitos, con extension opcional (ej: 1234567 o 1234567-1F)"
                : tipoDocWatch === "PASAPORTE"
                ? "Letras y numeros, 6 a 20 caracteres"
                : "Formato: 12345678-9 o 12345678-K"
            }
          >
            <input
              id="ci"
              type="text"
              disabled={isSubmitting}
              autoComplete="off"
              {...register("ci")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>
        </div>
      </section>

      {/* Seccion 2: Datos personales */}
      <section className={seccionClass}>
        <h2 className={headerSeccionClass}>Datos Personales</h2>

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
              placeholder="Ingrese su apellido paterno"
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
              placeholder="Ingrese su apellido materno"
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
            placeholder="Ingrese su(s) nombre(s)"
            {...register("nombre")}
            className={INPUT_CLASSES}
            style={INPUT_STYLE}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="apellidoCasado"
            label="Apellido de Casada:"
            error={errors.apellidoCasado?.message}
            helpText="Solo para clientes femeninas casadas (OPCIONAL)"
          >
            <input
              id="apellidoCasado"
              type="text"
              disabled={isSubmitting}
              {...register("apellidoCasado")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>

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
              <option value="">Sin especificar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="fechaNacimiento"
            label="Fecha de Nacimiento:"
            required
            error={errors.fechaNacimiento?.message}
            helpText="El cliente debe ser mayor de 18 años"
          >
            <input
              id="fechaNacimiento"
              type="date"
              disabled={isSubmitting}
              // max: no puede nacer en el futuro ni ser menor de 18.
              // Calculamos la fecha maxima permitida (18 años atras).
              max={(() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - 18);
                return d.toISOString().split("T")[0];
              })()}
              {...register("fechaNacimiento")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>

          <FormField
            id="nacionalidad"
            label="Nacionalidad:"
            error={errors.nacionalidad?.message}
          >
            <input
              id="nacionalidad"
              type="text"
              disabled={isSubmitting}
              placeholder="Ej: BOLIVIANA"
              {...register("nacionalidad")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>
        </div>
      </section>

      {/* Seccion 3: Contacto */}
      <section className={seccionClass}>
        <h2 className={headerSeccionClass}>Contacto</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="telefono"
            label="Teléfono:"
            required
            error={errors.telefono?.message}
          >
            <input
              id="telefono"
              type="tel"
              disabled={isSubmitting}
              placeholder="Ej: 77700000"
              {...register("telefono")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>

          <FormField
            id="nit"
            label="NIT:"
            error={errors.nit?.message}
          >
            <input
              id="nit"
              type="text"
              disabled={isSubmitting}
              placeholder="Ingrese su NIT"
              {...register("nit")}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            />
          </FormField>
        </div>
      </section>

      {/* Seccion 4: Ubicacion */}
      <section className={seccionClass}>
        <h2 className={headerSeccionClass}>Ubicación</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="idLocalidad"
            label="Localidad:"
            error={errors.idLocalidad?.message}
          >
            <select
              id="idLocalidad"
              disabled={isSubmitting}
              // RHF con valueAsNumber para que el valor sea number | null.
              {...register("idLocalidad", { valueAsNumber: true })}
              className={INPUT_CLASSES}
              style={INPUT_STYLE}
            >
              <option value="">Sin localidad</option>
              {localidades.filter((l) => l.estado).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="idZona"
            label="Zona:"
            error={errors.idZona?.message}
            helpText={
              !idLocalidadWatch
                ? "Primero selecciona una localidad"
                : undefined
            }
          >
            <select
              id="idZona"
              disabled={isSubmitting || !idLocalidadWatch}
              {...register("idZona", { valueAsNumber: true })}
              className={INPUT_CLASSES}
              style={{
                ...INPUT_STYLE,
                opacity: !idLocalidadWatch ? 0.5 : 1,
              }}
            >
              <option value="">Seleccione Zona</option>
              {zonasDisponibles.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
          id="direccion"
          label="Complemente su Dirección:"
          error={errors.direccion?.message}
        >
          <input
            id="direccion"
            type="text"
            disabled={isSubmitting}
            placeholder="Ej: CALLE 5 # 123"
            {...register("direccion")}
            className={INPUT_CLASSES}
            style={INPUT_STYLE}
          />
        </FormField>
        </div>
      </section>

      {/* Botones de accion */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={isSubmitting}
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
          style={{ borderColor: "var(--color-border)" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center text-foreground gap-2 rounded-md px-6 py-2 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-header-accent)",
          }}
        >
          {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          {labelSubmit}
        </button>
      </div>
    </form>
  );
}