// Fila del formulario para una joya dentro del array de joyas del contrato.
// Usa useWatch (nunca watch()) para leer idKilate y pesoNeto en tiempo real y mostrar el valorPrestamo estimado calculado localmente.
// Se monta/desmonta con el array de useFieldArray: el unmounting limpia el estado del formulario automaticamente (no necesita useEffect + reset).
"use client";
import { useWatch } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Trash2 } from "lucide-react";
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

interface JoyaFilaProps {
  index: number;
  control: Control<ContratoFormValues>;
  register: UseFormRegister<ContratoFormValues>;
  errors: FieldErrors<ContratoFormValues>;
  kilates: Kilate[];
  tiposJoya: TipoJoya[];
  onEliminar: () => void;
  // Solo se puede eliminar si hay mas de una joya (la ultima no se puede sacar)
  puedeEliminar: boolean;
}

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";
const selectClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

// Formato boliviano para montos
function formatMonto(n: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function JoyaFila({
  index,
  control,
  register,
  errors,
  kilates,
  tiposJoya,
  onEliminar,
  puedeEliminar,
}: JoyaFilaProps) {
  // useWatch (no watch()): lee valores en tiempo real sin warnings del React Compiler
  // Necesitamos idKilate y pesoNeto para calcular valorPrestamo localmente
  const idKilate = useWatch({ control, name: `joyas.${index}.idKilate` });
  const pesoNeto = useWatch({ control, name: `joyas.${index}.pesoNeto` });

  // Calculo local del valor prestamo: pesoNeto * precioGramo del kilate seleccionado
  // Este valor es orientativo; el calculo oficial lo hace el backend en /calcular
  const kilateSeleccionado = kilates.find((k) => k.id === Number(idKilate));
  const precioGramo = kilateSeleccionado?.precioGramo ?? 0;
  const pesoNetoNum = Number(pesoNeto) || 0;
  const valorPrestimoLocal = pesoNetoNum * precioGramo;

  // Acceso seguro a los errores de este indice en el array
  const erroresJoya = errors.joyas?.[index];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header de la fila con numero y boton de eliminar */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Joya Nro: {index + 1}
        </h4>
        <div className="flex items-center gap-3">
          {/* Valor estimado calculado localmente */}
          {valorPrestimoLocal > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              Tasación Estimada:{" "}
              <span className="font-semibold text-foreground">
                {formatMonto(valorPrestimoLocal)} BOB
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={onEliminar}
            disabled={!puedeEliminar}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20"
            aria-label={`Eliminar joya ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Campos del formulario en grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tipo de joya */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Seleccione Tipo de Joya: <span className="text-red-500">*</span>
          </label>
            <select
            {...register(`joyas.${index}.idTipoJoya`, { valueAsNumber: true })}
            className={selectClass}
            aria-invalid={!!erroresJoya?.idTipoJoya}
            >
            <option value="">Seleccionar...</option>
            {tiposJoya
              .filter((t) => t.estado)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.descripcion}
                </option>
              ))}
          </select>
          {erroresJoya?.idTipoJoya && (
            <p className={errorClass}>{erroresJoya.idTipoJoya.message}</p>
          )}
        </div>

        {/* Kilate */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Seleccione un Kilate: <span className="text-red-500">*</span>
          </label>
            <select
            {...register(`joyas.${index}.idKilate`, { valueAsNumber: true })}
            className={selectClass}
            aria-invalid={!!erroresJoya?.idKilate}
            >
            <option value="">Seleccionar...</option>
            {kilates
              .filter((k) => k.estado)
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kilate}k a {formatMonto(k.precioGramo)} BOB/g
                </option>
              ))}
          </select>
          {erroresJoya?.idKilate && (
            <p className={errorClass}>{erroresJoya.idKilate.message}</p>
          )}
        </div>

        {/* Peso bruto */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ingrese Peso bruto (g): <span className="text-red-500">*</span>
          </label>
            <input
            type="number"
            step="0.01"
            min="0"
            {...register(`joyas.${index}.pesoBruto`, { valueAsNumber: true })}
            className={inputClass}
            placeholder="0.00"
            aria-invalid={!!erroresJoya?.pesoBruto}
            />
          {erroresJoya?.pesoBruto && (
            <p className={errorClass}>{erroresJoya.pesoBruto.message}</p>
          )}
        </div>

        {/* Peso neto */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ingrese Peso neto (g): <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register(`joyas.${index}.pesoNeto`, { valueAsNumber: true })}
            className={inputClass}
            placeholder="0.00"
            aria-invalid={!!erroresJoya?.pesoNeto}
          />
          {erroresJoya?.pesoNeto && (
            <p className={errorClass}>{erroresJoya.pesoNeto.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Peso del oro sin piedras ni apliques
          </p>
        </div>

        {/* Tasacion manual (opcional) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Tasación Manual (BOB):
          </label>
            <input
            type="number"
            step="0.01"
            min="0"
            {...register(`joyas.${index}.valorTasacion`, {
                setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
            })}
            className={inputClass}
            placeholder="Opcional"
            aria-invalid={!!erroresJoya?.valorTasacion}
            />
          {erroresJoya?.valorTasacion && (
            <p className={errorClass}>{String(erroresJoya.valorTasacion.message)}</p>
          )}
        </div>

        {/* Observaciones */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Observaciones:
          </label>
          <input
            type="text"
            {...register(`joyas.${index}.observaciones`)}
            className={inputClass}
            placeholder="Color, grabados, danos, marcas..."
            maxLength={200}
          />
        </div>
      </div>
    </div>
  );
}