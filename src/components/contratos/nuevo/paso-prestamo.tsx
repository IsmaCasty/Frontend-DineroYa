// Paso 3 del wizard: configuracion del prestamo.
// Maneja su propio estado de calculo (calcResult, calcLoading) para no contaminar el estado del wizard padre.
// El boton "Calcular" lee los valores del formulario con useWatch y llama al backend; setState ocurre solo en callbacks async, nunca en useEffect.
"use client";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Calculator, Loader2, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { PanelCalculoPreview } from "@/components/contratos/nuevo/panel-calculo-preview";
import type { ContratoFormValues } from "@/lib/validators/contrato.schema";
import type {
  CalculoPrestamoResponse,
  CalcularPrestamoInput,
} from "@/lib/api/types/contrato.types";

interface Kilate {
  id: number;
  kilate: number;
  precioGramo: number;
  estado: boolean;
}

interface PasoPrestamoProps {
  control: Control<ContratoFormValues>;
  register: UseFormRegister<ContratoFormValues>;
  errors: FieldErrors<ContratoFormValues>;
  kilates: Kilate[];
}

function formatMonto(n: number): string {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Monedas hardcodeadas: el seeder siempre crea exactamente BOB y USD con estos IDs
const MONEDAS = [
  { id: 1, codigoIso: "BOB", descripcion: "Bolivianos" },
  { id: 2, codigoIso: "USD", descripcion: "Dolares" },
];

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const selectClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function PasoPrestamo({ control, register, errors, kilates }: PasoPrestamoProps) {
  const { showToast } = useToast();

  // Estado del calculo: se actualiza solo en callbacks async (sin cascada)
  const [calcResult, setCalcResult] = useState<CalculoPrestamoResponse | null>(
    null
  );
  const [calcLoading, setCalcLoading] = useState(false);

  // useWatch para leer en tiempo real los valores que necesita el calculo.
  // Incluye las joyas del paso 2 para armar el payload de /calcular.
  const joyas = useWatch({ control, name: "joyas" });
  const montoSolicitado = useWatch({ control, name: "montoSolicitado" });
  const idMoneda = useWatch({ control, name: "idMoneda" });
  const diasPlazo = useWatch({ control, name: "diasPlazo" });
  const idMonedaNum = Number(idMoneda);
  // Recalcula el monto máximo de las joyas del paso 2 para mostrarlo como referencia.
  // Usa el mismo useWatch de joyas que ya existe arriba, no hace falta una nueva suscripción.
  const montoMaximoLocal = (joyas ?? []).reduce((suma, joya) => {
    if (!joya) return suma;
    const kilate = kilates.find((k) => k.id === Number(joya.idKilate));
    const precio = kilate?.precioGramo ?? 0;
    const pesoNeto = Number(joya.pesoNeto) || 0;
    return suma + pesoNeto * precio;
  }, 0);

  const calcular = () => {
    // Validacion basica del cliente antes de la llamada al backend
    if (!joyas || joyas.length === 0) {
      showToast("Agrega al menos una joya antes de calcular", "error");
      return;
    }
    if (!montoSolicitado || Number(montoSolicitado) <= 0) {
      showToast("Ingresa el monto solicitado", "error");
      return;
    }

    // setState en el handler del boton (evento de usuario): correcto
    setCalcLoading(true);
    setCalcResult(null);

    const payload: CalcularPrestamoInput = {
      joyas: joyas.map((j) => ({
        idTipoJoya: Number(j.idTipoJoya),
        idKilate: Number(j.idKilate),
        pesoBruto: Number(j.pesoBruto),
        pesoNeto: Number(j.pesoNeto),
        observaciones: j.observaciones || undefined,
        valorTasacion: j.valorTasacion ? Number(j.valorTasacion) : undefined,
      })),
      montoSolicitado: Number(montoSolicitado),
      idMoneda: idMonedaNum,
      diasPlazo: Number(diasPlazo) || 30,
    };

    // Tipo intermedio: evita ambiguedad del parser JSX con genericos en .tsx
    type CalcResp = CalculoPrestamoResponse;
    apiRequest<CalcResp>(ENDPOINTS.contratos.calcular, {
    method: "POST",
    body: payload,  // objeto directo, el cliente hace el stringify
    })
      .then((data) => {
        // setState en callback async: sin cascada de renders
        setCalcResult(data);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Error al calcular el prestamo";
        showToast(msg, "error");
      })
      .finally(() => {
        setCalcLoading(false);
      });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Tercer Paso: Configuración del Préstamo
          </h3>
          <p className="text-xs text-muted-foreground">
            Define el monto y condiciones. Usa &quot;Calcular&quot; para ver el desglose
            de intereses antes de confirmar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Monto solicitado */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ingrese Monto Solicitado: <span className="text-red-500">*</span>
          </label>
            <input
            type="number"
            step="1"
            min="1"
            {...register("montoSolicitado", { valueAsNumber: true })}
            className={inputClass}
            placeholder="5000"
            aria-invalid={!!errors.montoSolicitado}
            />
          {errors.montoSolicitado && (
            <p className={errorClass}>{errors.montoSolicitado.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Solo números enteros, sin decimales
          </p>
        </div>

        {/* Moneda */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Seleccione Moneda: <span className="text-red-500">*</span>
          </label>
            <select
            {...register("idMoneda", { valueAsNumber: true })}
            className={selectClass}
            aria-invalid={!!errors.idMoneda}
            >
            {MONEDAS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.codigoIso} - {m.descripcion}
              </option>
            ))}
          </select>
          {idMonedaNum === 2 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              La Jefa debe registrar el tipo de cambio del dia antes de crear un
              contrato en USD.
            </p>
          )}
        </div>

        {/* Numero de folio fisico */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            N° Folio (Impreso en Contrato fisico):
          </label>
          <input
            type="text"
            {...register("nroFolio")}
            className={inputClass}
            placeholder="Numero pre-impreso"
            maxLength={20}
          />
        </div>

        {/* Dias de plazo */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Plazo del Contrato (días):
          </label>
            <input
            type="number"
            step="1"
            min="1"
            {...register("diasPlazo", { valueAsNumber: true })}
            className={inputClass}
            defaultValue={30}
            />
          {errors.diasPlazo && (
            <p className={errorClass}>{errors.diasPlazo.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Siempre 30 días en la empresa
          </p>
        </div>

        {/* Observaciones del contrato */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Observaciones Internas:
          </label>
          <textarea
            {...register("observacionesContrato")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={2}
            placeholder="Notas internas del contrato (no aparecen en el comprobante)"
            maxLength={500}
          />
        </div>
      </div>

     {/* Botón de calcular + banner de monto máximo: lado a lado */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={calcular}
          disabled={calcLoading}
          className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {calcLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          {calcLoading ? "Calculando..." : "Calcular Vista Previa"}
        </button>

        {montoMaximoLocal > 0 && (
          <div
            className="flex flex-1 items-center justify-between rounded-lg border px-4 py-2"
            style={{ borderColor: '#c9a227', backgroundColor: 'rgba(201, 162, 39, 0.06)' }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              MÁXIMO PRESTABLE (no ingreses más):
            </p>
            <p className="text-base font-bold tabular-nums" style={{ color: '#c9a227' }}>
              {formatMonto(montoMaximoLocal)} BOB
            </p>
          </div>
        )}
      </div>

      {/* Panel de resultado del calculo */}
      {calcResult && <PanelCalculoPreview calculo={calcResult} />}
    </div>
  );
}