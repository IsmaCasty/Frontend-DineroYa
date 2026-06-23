// Paso 2 del wizard: registro de joyas en garantia.
// Usa useFieldArray de React Hook Form para manejar el array dinamico.
// Muestra el monto maximo prestable calculado localmente en tiempo real a partir de los datos de los kilates (pesoNeto * precioGramo).
// La validacion cruzada real la hace el backend en /calcular (paso 3).
"use client";
import { useFieldArray, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { PlusCircle, Gem } from "lucide-react";
import { JoyaFila } from "@/components/contratos/nuevo/joya-fila";
import type { ContratoFormValues } from "@/lib/validators/contrato.schema";

interface Kilate {      
  id: number;
  kilate: number;
  precioGramo: number;
  estado: boolean;
}

interface TipoJoya {
  id: number;
  descripcion: string;
  estado: boolean;
}

interface PasoJoyasProps {
  control: Control<ContratoFormValues>;
  register: UseFormRegister<ContratoFormValues>;
  errors: FieldErrors<ContratoFormValues>;
  kilates: Kilate[];
  tiposJoya: TipoJoya[];
}

// Valores iniciales de una joya nueva al hacer click en "Agregar joya"
const JOYA_VACIA = {
  idTipoJoya: 0,
  idKilate: 0,
  pesoBruto: 0,
  pesoNeto: 0,
  observaciones: "",
  valorTasacion: undefined,
} as const;

// Formato boliviano
function formatMonto(n: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function PasoJoyas({
  control,
  register,
  errors,
  kilates,
  tiposJoya,
}: PasoJoyasProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "joyas",
  });

  // useWatch (no watch()) sobre el array completo de joyas.
  // Se recalcula cada vez que cualquier joya cambia idKilate o pesoNeto.
  const joyasValues = useWatch({ control, name: "joyas" });

  // Calculo local del monto maximo prestable: suma de pesoNeto * precioGramo
  // por cada joya. Solo es orientativo; el calculo oficial esta en el backend.
  const montoMaximoLocal = (joyasValues ?? []).reduce((suma, joya) => {
    if (!joya) return suma;
    const kilate = kilates.find((k) => k.id === Number(joya.idKilate));
    const precio = kilate?.precioGramo ?? 0;
    const pesoNeto = Number(joya.pesoNeto) || 0;
    return suma + pesoNeto * precio;
  }, 0);

  const agregarJoya = () => {
    append({ ...JOYA_VACIA });
  };

  return (
    <div className="space-y-4">
      {/* Header del paso */}
      <div className="flex items-center gap-2">
        <Gem className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Segundo Paso: Joyas en Garantía
          </h3>
          <p className="text-xs text-muted-foreground">
            Registra todas las joyas que el cliente entrega como garantÍa
          </p>
        </div>
      </div>

      {/* Lista de filas de joyas */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <JoyaFila
            key={field.id}
            index={index}
            control={control}
            register={register}
            errors={errors}
            kilates={kilates}
            tiposJoya={tiposJoya}
            onEliminar={() => remove(index)}
            // La ultima joya no se puede eliminar: el contrato necesita al menos una
            puedeEliminar={fields.length > 1}
          />
        ))}
      </div>

      {/* Error del array entero (ej: "Debe agregar al menos una joya") */}
      {errors.joyas && !Array.isArray(errors.joyas) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors.joyas.message}
        </p>
      )}

      {/* Boton para agregar joya */}
      <button
        type="button"
        onClick={agregarJoya}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
      >
        <PlusCircle className="h-4 w-4" />
        Agregar otra joya
      </button>

      {/* Panel de totales estimados: solo visible si hay joyas con valores */}
      {montoMaximoLocal > 0 && (
        <div
          className="flex items-center justify-between rounded-lg border px-4 py-3"
          // Borde dorado hardcodeado: identidad de marca en elemento de acento
          style={{ borderColor: "#c9a227", backgroundColor: "transparent" }}
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              MONTO MÁXIMO PRESTABLE (Cálculo Estimado):
            </p>
          </div>
          <p
            className="text-xl font-bold"
            style={{ color: "#c9a227" }}
          >
            {formatMonto(montoMaximoLocal)} BOB
          </p>
        </div>
      )}
    </div>
  );
}