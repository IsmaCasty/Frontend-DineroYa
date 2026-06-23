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

// ===== SCHEMA =====
const pagoSchema = z.object({
  monedaPago: z.enum(['BOB', 'USD'], { message: 'Seleccione una moneda' }),
  montoCapital: z
    .number({ message: 'Ingrese un monto válido' })
    .min(0, 'El monto debe ser 0 o mayor'),
});

type PagoFormValues = z.infer<typeof pagoSchema>;
type Paso = 'formulario' | 'preview' | 'confirmado';

interface Props {
  contrato: ContratoParaPago;
  onPagoRegistrado: () => void;
}

// ===== HELPERS =====
function fmt(n: number): string {
  return n.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtFecha(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function redondear(v: number): number {
  return Math.round(v * 100) / 100;
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
  const [valoresConfirmar, setValoresConfirmar] = useState<PagoFormValues | null>(null);
  const [resultado, setResultado] = useState<PagoResponse | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [tcHoy, setTcHoy] = useState<TipoCambioHoy | null>(null);
  // P#6: monto que el cliente entrega físicamente, para calcular vuelto
  const [montoEntregado, setMontoEntregado] = useState<number | ''>('');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PagoFormValues>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      monedaPago: contrato.moneda.codigoIso === 'USD' ? 'USD' : 'BOB',
      montoCapital: 0,
    },
  });

  const monedaPago = useWatch({ control, name: 'monedaPago' });
  // Moneda del contrato (en qué moneda está el capital)
  const contratoMoneda = contrato.moneda.codigoIso;

  const cargarTcHoy = useCallback(async () => {
    try {
      type Resp = TipoCambioHoy;
      const tc = await apiRequest<Resp>(ENDPOINTS.pagos.tipoCambioVigente);
      setTcHoy(tc);
    } catch {
      setTcHoy(null);
    }
  }, []);

  useEffect(() => {
    void cargarTcHoy();
  }, [cargarTcHoy]);

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
      showToast(e instanceof Error ? e.message : 'Error al calcular el pago.', 'error');
    } finally {
      setCalculando(false);
    }
  };

  const onConfirmar = async () => {
    if (!valoresConfirmar) return;
    setConfirmando(true);
    try {
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
      showToast(e instanceof Error ? e.message : 'Error al registrar el pago.', 'error');
    } finally {
      setConfirmando(false);
    }
  };

  const volverAFormulario = () => {
    setPaso('formulario');
    setPreview(null);
    setValoresConfirmar(null);
    setMontoEntregado('');
  };

  const abrirComprobante = async (idPago: number) => {
    try {
      const token = tokenStorage.getAccessToken();
      const base = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${base}${ENDPOINTS.pagos.comprobante(idPago)}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al obtener el comprobante');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
    } catch {
      showToast('No se pudo abrir el comprobante PDF.', 'error');
    }
  };

  if (['CANCELADO', 'ANULADO'].includes(contrato.estado.toUpperCase())) {
    return (
      <div className="rounded-lg border border-muted bg-muted/20 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="font-medium text-foreground">Este contrato no acepta pagos</p>
        <p className="mt-1 text-sm text-muted-foreground">Estado actual: {contrato.estado}</p>
      </div>
    );
  }

  // ===== RENDER: FORMULARIO =====
  if (paso === 'formulario') {
    // Indica si hay conversión de moneda: contrato en USD pero pago en BOB o viceversa
    const hayConversionEnForm = contratoMoneda !== monedaPago;

    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-foreground uppercase tracking-wide">
          Datos del Pago
        </h2>

        {/* TC del día */}
        {tcHoy ? (
          <div className="mb-4 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Tipo de Cambio del día:{' '}
            <span className="font-semibold text-foreground">
              1 USD = {tcHoy.ventaPublico.toFixed(2)} BOB
            </span>
          </div>
        ) : (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
            No hay tipo de cambio registrado hoy. Los pagos en dólares no serán posibles
            hasta que la Jefa lo registre.
          </div>
        )}

        <form onSubmit={handleSubmit(onCalcular)} className="flex flex-col gap-4">
          {/* Moneda de pago */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Moneda con la que paga el cliente:
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
                  style={monedaPago === m ? { backgroundColor: '#1a3a1a' } : undefined}
                >
                  <input type="radio" value={m} {...register('monedaPago')} className="sr-only" />
                  {m === 'BOB' ? 'Bolivianos (BOB)' : 'Dólares (USD)'}
                </label>
              ))}
            </div>
            {errors.monedaPago && (
              <p className="mt-1 text-xs text-red-500">{errors.monedaPago.message}</p>
            )}
            {/* Aviso de conversión cuando las monedas no coinciden */}
            {hayConversionEnForm && (
              <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                El contrato está en {contratoMoneda}. El capital se ingresa en{' '}
                {contratoMoneda} y el total a cobrar se convertirá a {monedaPago} en
                el resumen.
              </p>
            )}
          </div>

          {/* Capital a amortizar — siempre en moneda del CONTRATO */}
          <div>
            <label htmlFor="montoCapital" className="mb-1.5 block text-sm font-medium text-foreground">
              Capital a Amortizar:{' '}
              <span className="font-normal text-muted-foreground">({contratoMoneda})</span>
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
              <p className="mt-1 text-xs text-red-500">{errors.montoCapital.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresa 0 para pagar solo el INTERÉS (extiende 30 días).
            </p>
          </div>

          {/* Atajo cancelar completo */}
          <button
            type="button"
            onClick={() => setValue('montoCapital', contrato.saldoCapital)}
            className="rounded-md border border-dashed border-muted-foreground/30 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Cancelar préstamo completo = {fmt(contrato.saldoCapital)} {contratoMoneda}
          </button>

          <button
            type="submit"
            disabled={calculando}
            className="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-foreground transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: 'var(--color-header-accent)' }}
          >
            {calculando ? 'Calculando...' : <><span>Calcular</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    );
  }

  // ===== RENDER: PREVIEW =====
  if (paso === 'preview' && preview) {
    const pagoMoneda = valoresConfirmar?.monedaPago ?? 'BOB';
    const tc = preview.tasaCambio;
    // Hay conversión cuando el contrato y el pago son en monedas distintas
    const necesitaConversion = pagoMoneda !== contratoMoneda && tc > 0;
    const esCancelacion = preview.tipoOperacion === 'CANCELACION';

    // El backend siempre calcula los montos en la moneda del CONTRATO.
    // Si el cliente paga en otra moneda, calculamos la conversión aquí.
    const totalEnPagoMoneda = necesitaConversion
      ? redondear(
          contratoMoneda === 'USD'
            ? preview.montoTotal * tc   // USD = BOB: multiplicar
            : preview.montoTotal / tc,  // BOB = USD: dividir
        )
      : preview.montoTotal;

    // Filas del desglose en MONEDA DEL CONTRATO (lo que el backend calcula)
    const filas = [
      {
        label: `Interés (${contrato.tasaInteres}%)`,
        monto: preview.montoInteres,
        mostrar: true,
      },
      {
        label: `Gastos administrativos (${contrato.tasaGastosAdmin}%)`,
        monto: preview.montoGastosAdmin,
        mostrar: true,
      },
      {
        label: 'Capital amortizado',
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
        {/* Encabezado */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Resumen del Pago
          </h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${claseBadgeTipo(preview.tipoOperacion)}`}>
            {labelTipo(preview.tipoOperacion)}
          </span>
        </div>

        {/* Tabla de desglose — siempre en moneda del contrato */}
        <div className="mb-3 overflow-hidden rounded-md border">
          {necesitaConversion && (
            <div className="border-b bg-muted/30 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cálculo base en {contratoMoneda} (moneda del contrato)
            </div>
          )}
          <table className="w-full text-sm">
            <tbody>
              {filas.map((f) => (
                <tr
                  key={f.label}
                  className="border-b last:border-b-0 hover:bg-muted/10"
                >
                  <td className="px-4 py-2.5 text-muted-foreground">{f.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                    {f.esDescuento ? '-' : ''}
                    {fmt(f.monto)} {contratoMoneda}
                  </td>
                </tr>
              ))}
              {/* Fila total: en moneda del contrato */}
              <tr style={{ borderTop: '2px solid #1a3a1a' }}>
                <td
                  className="px-4 py-3 font-bold text-foreground"
                >
                  {necesitaConversion
                    ? `Subtotal en ${contratoMoneda}:`
                    : 'TOTAL A PAGAR:'}
                </td>
                <td
                  className="px-4 py-3 text-right text-lg font-bold tabular-nums"
                  style={{ color: necesitaConversion ? 'inherit' : '#c9a227' }}
                >
                  {fmt(preview.montoTotal)} {contratoMoneda}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bloque de conversión — solo cuando hay diferencia de monedas (P#3) */}
        {necesitaConversion && (
          <div className="mb-3 overflow-hidden rounded-md border-2" style={{ borderColor: '#1a3a1a' }}>
            <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              1 USD = {tc.toFixed(2)} BOB
              {contratoMoneda === 'USD'
                ? ` = ${fmt(preview.montoTotal)} USD × ${tc.toFixed(2)} = ${fmt(totalEnPagoMoneda)} BOB`
                : ` = ${fmt(preview.montoTotal)} BOB ÷ ${tc.toFixed(2)} = ${fmt(totalEnPagoMoneda)} USD`}
            </div>
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ backgroundColor: '#1a3a1a' }}
            >
              <span className="text-sm font-bold text-white">
                TOTAL A COBRAR EN {pagoMoneda}:
              </span>
              <span className="text-xl font-bold tabular-nums" style={{ color: '#c9a227' }}>
                {fmt(totalEnPagoMoneda)} {pagoMoneda}
              </span>
            </div>
          </div>
        )}

        {/* Calculadora de vuelto — P#6 */}
        <div className="mb-3 rounded-md border bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calcular Cambio
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-muted-foreground">
                Ingresa monto en efectivo ({pagoMoneda}):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={fmt(totalEnPagoMoneda)}
                value={montoEntregado}
                onChange={(e) =>
                  setMontoEntregado(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-sm text-muted-foreground">Cambio a dar:</p>
              {montoEntregado !== '' &&
              Number(montoEntregado) >= totalEnPagoMoneda ? (
                <p className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">
                  {fmt(Number(montoEntregado) - totalEnPagoMoneda)} {pagoMoneda}
                </p>
              ) : montoEntregado !== '' &&
                Number(montoEntregado) < totalEnPagoMoneda ? (
                <p className="text-sm font-medium text-red-500">
                  Faltan {fmt(totalEnPagoMoneda - Number(montoEntregado))}{' '}
                  {pagoMoneda}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">...</p>
              )}
            </div>
          </div>
        </div>

        {/* Saldo antes y después — siempre en moneda del contrato */}
        <div className="mb-3 rounded-md bg-muted/40 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Saldo actual:</span>
            <span className="tabular-nums font-medium">
              {fmt(preview.saldoCapitalAntes)} {contratoMoneda}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Saldo posterior:</span>
            <span
              className={`font-semibold tabular-nums ${
                preview.saldoCapitalDespues === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-foreground'
              }`}
            >
              {fmt(preview.saldoCapitalDespues)} {contratoMoneda}
            </span>
          </div>
        </div>

        {/* Aviso cancelación */}
        {esCancelacion && (
          <div className="mb-3 rounded-md bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
            Este pago cancela el préstamo. Las joyas quedarán disponibles para
            devolución al cliente.
          </div>
        )}

        {/* Botones */}
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
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>

        <h2 className="text-lg font-bold text-foreground">
          Pago Registrado Exitosamente
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {labelTipo(resultado.tipoOperacion)} | Contrato {resultado.nroContrato}
        </p>

        <div
          className="mx-auto my-5 w-fit rounded-xl px-8 py-4"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            Recibo N°
          </p>
          <p className="text-4xl font-bold tabular-nums" style={{ color: '#c9a227' }}>
            {resultado.nroRecibo}
          </p>
        </div>

        <div className="mx-auto mb-5 max-w-xs rounded-md bg-muted/40 px-4 py-3 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total pagado:</span>
            <span className="font-semibold tabular-nums">
              {fmt(resultado.montoTotal)} {resultado.monedaPago}
            </span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">Saldo restante:</span>
            <span className="font-semibold tabular-nums">
              {fmt(resultado.saldoCapitalDespues)} {contratoMoneda}
            </span>
          </div>
          {resultado.nuevaFechaPago && (
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Nuevo vencimiento:</span>
              <span className="font-semibold" style={{ color: '#c9a227' }}>
                {fmtFecha(resultado.nuevaFechaPago)}
              </span>
            </div>
          )}
        </div>

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