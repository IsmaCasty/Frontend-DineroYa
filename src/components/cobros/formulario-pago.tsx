// frontend/src/components/cobros/formulario-pago.tsx
// Formulario de registro de pago (RF-31, RF-32, RF-33).
// Flujo interno: formulario → preview (calcular sin persistir) → confirmado.
// El usuario ve el desglose antes de confirmar; así evita errores de monto.

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { tokenStorage } from '@/lib/auth/token-storage';
import type {
  ContratoParaPago,
  CalcularPagoResponse,
  CrearPagoInput,
  PagoResponse,
  TipoCambioHoy,
} from '@/lib/api/types/pago.types';

// ===== SCHEMA ZOD =====
// Validación simple: montoCapital >= 0.
// El techo máximo lo valida el backend (depende del TC del día y el saldo).
const pagoSchema = z.object({
  monedaPago: z.enum(['BOB', 'USD'], {
    message: 'Seleccione una moneda',
  }),
  montoCapital: z
    .number({ message: 'Ingrese un monto válido' })
    .min(0, 'El monto debe ser 0 o mayor'),
});

type PagoFormValues = z.infer<typeof pagoSchema>;

// ===== TIPOS LOCALES =====
// Los tres estados del flujo de pago dentro de esta pantalla.
type Paso = 'formulario' | 'preview' | 'confirmado';

interface Props {
  contrato: ContratoParaPago;
  // Se llama al hacer click en "Registrar otro cobro": el page vuelve a búsqueda.
  onPagoRegistrado: () => void;
}

// ===== HELPERS =====
function fmt(monto: number): string {
  return monto.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

function labelTipo(tipo: string): string {
  if (tipo === 'PAGO_INTERES') return 'Pago de Interés';
  if (tipo === 'AMORTIZACION') return 'Amortización';
  if (tipo === 'CANCELACION') return 'Cancelación Total';
  return tipo;
}

function claseBadgeTipo(tipo: string): string {
  if (tipo === 'PAGO_INTERES')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
  if (tipo === 'AMORTIZACION')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
  if (tipo === 'CANCELACION')
    return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
  return 'bg-muted text-muted-foreground';
}

// ===== COMPONENTE =====
export function FormularioPago({ contrato, onPagoRegistrado }: Props) {
  const { showToast } = useToast();

  const [paso, setPaso] = useState<Paso>('formulario');
  const [preview, setPreview] = useState<CalcularPagoResponse | null>(null);
  // Guardamos los valores del formulario al calcular para reutilizarlos al confirmar.
  // Así evitamos pasar por el handleSubmit dos veces.
  const [valoresConfirmar, setValoresConfirmar] =
    useState<PagoFormValues | null>(null);
  const [resultado, setResultado] = useState<PagoResponse | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [tcHoy, setTcHoy] = useState<TipoCambioHoy | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PagoFormValues>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      // Moneda por defecto: la misma del contrato
      monedaPago: contrato.moneda.codigoIso === 'USD' ? 'USD' : 'BOB',
      montoCapital: 0,
    },
  });

  // useWatch en lugar de watch() para evitar warnings del React Compiler
  const monedaPago = useWatch({ control, name: 'monedaPago' });

  // Carga el TC del día para mostrarlo como referencia en el formulario
  const cargarTcHoy = useCallback(async () => {
    try {
      type Resp = TipoCambioHoy;
      const tc = await apiRequest<Resp>(ENDPOINTS.pagos.tipoCambioHoy);
      setTcHoy(tc);
    } catch {
      // Sin TC hoy: no bloqueamos el form, el backend rechazará si intenta pagar en USD
      setTcHoy(null);
    }
  }, []);

  useEffect(() => {
    void cargarTcHoy();
  }, [cargarTcHoy]);

  // PASO 1: calcular preview sin persistir
  const onCalcular = async (values: PagoFormValues) => {
    setCalculando(true);
    try {
      type Resp = CalcularPagoResponse;
      const calc = await apiRequest<Resp>(ENDPOINTS.pagos.calcular, {
        method: 'POST',
        body: JSON.stringify({
          idContrato: contrato.id,
          montoCapital: values.montoCapital,
          monedaPago: values.monedaPago,
        }),
      });
      setPreview(calc);
      setValoresConfirmar(values);
      setPaso('preview');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'Error al calcular el pago.',
        'error',
      );
    } finally {
      setCalculando(false);
    }
  };

  // PASO 2: confirmar y persistir el pago
  const onConfirmar = async () => {
    if (!valoresConfirmar) return;
    setConfirmando(true);
    try {
      // Alias de tipo antes del genérico para evitar ambigüedad del parser JSX
      const body: CrearPagoInput = {
        idContrato: contrato.id,
        montoCapital: valoresConfirmar.montoCapital,
        monedaPago: valoresConfirmar.monedaPago,
      };
      type Resp = PagoResponse;
      const pago = await apiRequest<Resp>(ENDPOINTS.pagos.crear, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResultado(pago);
      setPaso('confirmado');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'Error al registrar el pago.',
        'error',
      );
    } finally {
      setConfirmando(false);
    }
  };

  const volverAFormulario = () => {
    setPaso('formulario');
    setPreview(null);
    setValoresConfirmar(null);
  };

  // Abre el PDF del comprobante usando fetch+blob porque el endpoint
  // requiere Bearer token. window.open() directo no envía headers de auth.
  const abrirComprobante = async (idPago: number) => {
    try {
      const token = tokenStorage.getAccessToken();
      const base = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(
        `${base}${ENDPOINTS.pagos.comprobante(idPago)}`,
        { headers: { Authorization: `Bearer ${token ?? ''}` } },
      );
      if (!res.ok) throw new Error('Error al obtener el comprobante');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      // Liberar la URL temporal después de que el navegador la abra
      setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
    } catch {
      showToast('No se pudo abrir el comprobante PDF.', 'error');
    }
  };

  // Contratos CANCELADOS o ANULADOS no aceptan pagos
  if (['CANCELADO', 'ANULADO'].includes(contrato.estado.toUpperCase())) {
    return (
      <div className="rounded-lg border border-muted bg-muted/20 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="font-medium text-foreground">
          Este contrato no acepta pagos
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado actual: {contrato.estado}
        </p>
      </div>
    );
  }

  // ===== RENDER: FORMULARIO =====
  if (paso === 'formulario') {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-foreground">
          DATOS DEL PAGO
        </h2>

        {/* Indicador del TC del día */}
        {tcHoy ? (
          <div className="mb-4 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            TC del día:{' '}
            <span className="font-semibold text-foreground">
              1 USD = {tcHoy.ventaPublico.toFixed(3)} Bs
            </span>
          </div>
        ) : (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
            No hay tipo de cambio registrado hoy. Los pagos en dólares no
            serán posibles hasta que la Jefa lo registre.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onCalcular)}
          className="flex flex-col gap-4"
        >
          {/* Moneda de pago: botones tipo toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Seleccion la Moneda de Pago:
            </label>
            <div className="flex gap-3">
              {(['BOB', 'USD'] as const).map((m) => (
                <label
                  key={m}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
                    monedaPago === m
                      ? 'border-transparent text-white'
                      : 'border-input bg-background text-foreground hover:bg-muted'
                  }`}
                  style={
                    monedaPago === m
                      ? { backgroundColor: '#1a3a1a' }
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    value={m}
                    {...register('monedaPago')}
                    className="sr-only"
                  />
                  {m === 'BOB' ? 'Bolivianos (Bs)' : 'Dólares ($)'}
                </label>
              ))}
            </div>
            {errors.monedaPago && (
              <p className="mt-1 text-xs text-red-500">
                {errors.monedaPago.message}
              </p>
            )}
          </div>

          {/* Monto capital a amortizar */}
          <div>
            <label
              htmlFor="montoCapital"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Capital a Amortizar:{' '}
              <span className="font-normal text-muted-foreground">
                ({monedaPago})
              </span>
            </label>
            <input
              id="montoCapital"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('montoCapital', { valueAsNumber: true })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.montoCapital && (
              <p className="mt-1 text-xs text-red-500">
                {errors.montoCapital.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresa 0 para pagar solo el INTERÉS (extiende 30 días). <br />
              Para CANCELAR el préstamo por completo usa el botón de abajo.
            </p>
          </div>

          {/* Atajo: cancelar préstamo completo */}
          <button
            type="button"
            onClick={() => setValue('montoCapital', contrato.saldoCapital)}
            className="rounded-md border border-dashed border-muted-foreground/30 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Si quiere cancelar préstamo completo , debe pagar →{' '}
            {fmt(contrato.saldoCapital)} {contrato.moneda.codigoIso}
          </button>

          {/* Calcular */}
          <button
            type="submit"
            disabled={calculando}
            className="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-foreground transition-colors disabled:opacity-50 hover:opacity-90"
            style={{
              backgroundColor: "var(--color-header-accent)",
            }}
          >
            {calculando ? (
              'Calculando...'
            ) : (
              <>
                Calcular
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ===== RENDER: PREVIEW =====
  if (paso === 'preview' && preview) {
    const moneda = valoresConfirmar?.monedaPago ?? 'BOB';
    const esCancelacion = preview.tipoOperacion === 'CANCELACION';

    // Filas del desglose; solo mostramos las que tienen monto > 0
    const filas = [
      { label: 'Interés' + ` (${contrato.tasaInteres}%)`, 
        monto: preview.montoInteres, 
        mostrar: true },
      {
        label: 'Gastos administrativos' + ` (${contrato.tasaGastosAdmin}%)`,
        monto: preview.montoGastosAdmin,
        mostrar: true,
      },
      {
        label: 'Capital Ingresado:',
        monto: preview.montoCapital,
        mostrar: preview.montoCapital > 0,
      },
      {
        label: 'Descuento',
        monto: preview.montoDescuento,
        mostrar: preview.montoDescuento > 0,
        esDescuento: true,
      },
    ].filter((f) => f.mostrar);

    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        {/* Encabezado con tipo de operación */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Resumen del Pago
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${claseBadgeTipo(preview.tipoOperacion)}`}
          >
            {labelTipo(preview.tipoOperacion)}
          </span>
        </div>

        {/* Desglose de montos */}
        <div className="mb-4 overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              {filas.map((f) => (
                <tr
                  key={f.label}
                  className="border-b font-medium last:border-b-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {f.label}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {f.esDescuento ? '-' : ''}
                    {fmt(f.monto)} {moneda}
                  </td>
                </tr>
              ))}
              {/* Fila total destacada */}
              <tr style={{ borderTop: '2px solid #1a3a1a' }}>
                <td
                  className="px-4 py-3 font-bold"
                  style={{ color: '#1a3a1a' }}
                >
                  TOTAL A PAGAR:
                </td>
                <td
                  className="px-4 py-3 text-right text-lg font-bold tabular-nums"
                  style={{ color: '#c9a227' }}
                >
                  {fmt(preview.montoTotal)} {moneda}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TC y equivalente en la otra moneda */}
        {preview.tasaCambio > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">
            TC aplicado: 1 USD = {preview.tasaCambio.toFixed(3)} Bs
            {moneda === 'USD' && (
              <>
                {' '}· Equivalente en BOB:{' '}
                <span className="font-medium text-foreground">
                  {fmt(preview.montoTotal * preview.tasaCambio)} BOB
                </span>
              </>
            )}
            {moneda === 'BOB' && preview.tasaCambio > 0 && (
              <>
                {' '}· Equivalente en USD:{' '}
                <span className="font-medium text-foreground">
                  {fmt(preview.montoTotal / preview.tasaCambio)} USD
                </span>
              </>
            )}
          </p>
        )}

        {/* Saldo antes y después */}
        <div className="mb-4 rounded-md bg-muted/40 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Saldo Actual:</span>
            <span className="tabular-nums font-medium">
              {fmt(preview.saldoCapitalAntes)} {contrato.moneda.codigoIso}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Saldo Posterior:</span>
            <span
              className={`font-semibold tabular-nums ${
                preview.saldoCapitalDespues === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-foreground'
              }`}
            >
              {fmt(preview.saldoCapitalDespues)} {contrato.moneda.codigoIso}
            </span>
          </div>
        </div>

        {/* Nueva fecha de vencimiento (si aplica) */}
      
        {/*preview.nuevaFechaVencimiento && !esCancelacion && (
          <div className="mb-4 rounded-md bg-green-50 px-4 py-2.5 text-sm dark:bg-green-950/20">
            <span className="text-muted-foreground">Nueva Fecha de Vencimiento: </span>
            <span className="text-green-700 dark:text-green-400">
              {fmtFecha(
                new Date(Date.now() - 4 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
              )}
            </span>
            <span className="text-muted-foreground"> + 30 días = </span>
            <span className="font-semibold text-green-700 dark:text-green-400">
              {fmtFecha(preview.nuevaFechaVencimiento)}
            </span>
          </div>
        )*/}

        {esCancelacion && (
          <div className="mb-4 rounded-md bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
            Este pago cancela el préstamo. Las joyas quedarán disponibles
            para devolución al cliente.
          </div>
        )}

        {/* Botones del preview */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={volverAFormulario}
            className="flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Corregir
          </button>
          <button
            type="button"
            onClick={() => void onConfirmar()}
            disabled={confirmando}
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#1a3a1a' }}
          >
            {confirmando ? (
              'Registrando...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Pago
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: CONFIRMADO =====
  if (paso === 'confirmado' && resultado) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        {/* Ícono de éxito */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>

        <h2 className="text-lg font-bold text-foreground">
          Pago Registrado Exitosamente!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {labelTipo(resultado.tipoOperacion)} | Contrato{' '}
          {resultado.nroContrato}
        </p>

        {/* Número de recibo */}
        <div
          className="mx-auto my-5 w-fit rounded-xl px-8 py-4"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            Recibo N°
          </p>
          <p
            className="text-4xl font-bold tabular-nums"
            style={{ color: '#c9a227' }}
          >
            {resultado.nroRecibo}
          </p>
        </div>

        {/* Resumen compacto */}
        <div className="mx-auto mb-5 max-w-xs rounded-md bg-muted/40 px-4 py-3 text-left text-sm">
          {/* Total pagado */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Total Pagado:
            </span>

            <span className="font-semibold tabular-nums">
              {fmt(resultado.montoTotal)}{" "}
              {resultado.monedaPago}
            </span>
          </div>

          {/* Saldo restante */}
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">
              Saldo Restante:
            </span>

            <span className="font-semibold tabular-nums">
              {fmt(resultado.saldoCapitalDespues)}{" "}
              {contrato.moneda.codigoIso}
            </span>
          </div>

          {/* Nuevo vencimiento */}
          {resultado.nuevaFechaPago && (
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">
                Nuevo Vencimiento:
              </span>

              <span
                className="font-semibold"
                style={{ color: "#c9a227" }}
              >
                {fmtFecha(resultado.nuevaFechaPago)}
              </span>
            </div>
          )}
        </div>

        {/* Botones finales */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => void abrirComprobante(resultado.id)}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Imprimir Comprobante
          </button>
          <button
            type="button"
            onClick={onPagoRegistrado}
            className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#1a3a1a' }}
          >
            <RefreshCw className="h-4 w-4" />
            Registrar otro Cobro
          </button>
        </div>
      </div>
    );
  }

  return null;
}