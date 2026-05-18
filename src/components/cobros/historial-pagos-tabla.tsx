// frontend/src/components/cobros/historial-pagos-tabla.tsx
// Tabla del historial de pagos con opciones de reimpresión y anulación.
// El Dialog de anulación usa Radix: cuando cierra, el contenido se desmonta
// automáticamente, lo que resetea el formulario sin useEffect.
'use client';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Printer,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { tokenStorage } from '@/lib/auth/token-storage';
import { useToast } from '@/lib/toast/use-toast';
import { formatearFechaHoraBolivia } from '@/lib/utils/fecha-bolivia';
import type { PagoListadoItem } from '@/lib/api/types/pago.types';

interface Props {
  pagos: PagoListadoItem[];
  total: number;
  cargando: boolean;
  pagina: number;
  porPagina: number;
  onCambiarPagina: (p: number) => void;
  // Callback al confirmar anulación: la lógica de red vive en el page
  onAnularPago: (
    id: number,
    motivo: string,
    descripcion?: string,
  ) => Promise<void>;
}

// ===== SCHEMA ANULACIÓN =====
// Motivos predefinidos más "OTRO" con descripción obligatoria
const anularSchema = z
  .object({
    motivo: z.enum(
      ['ERROR_MONTO', 'CLIENTE_INCORRECTO', 'DUPLICADO', 'OTRO'],
      { message: 'Seleccione un motivo' },
    ),
    descripcion: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.motivo === 'OTRO' &&
      (!data.descripcion?.trim() || data.descripcion.trim().length < 3)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ingrese una descripción del motivo (mínimo 3 caracteres)',
        path: ['descripcion'],
      });
    }
  });

type AnularFormValues = z.infer<typeof anularSchema>;

// ===== HELPERS =====
function fmt(monto: number): string {
  return monto.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function labelTipo(tipo: string): string {
  if (tipo === 'PAGO_INTERES') return 'Interés';
  if (tipo === 'AMORTIZACION') return 'Amortización';
  if (tipo === 'CANCELACION') return 'Cancelación';
  return tipo;
}

function claseTipo(tipo: string): string {
  if (tipo === 'PAGO_INTERES')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
  if (tipo === 'AMORTIZACION')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
  if (tipo === 'CANCELACION')
    return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
  return 'bg-muted text-muted-foreground';
}

// Un pago es anulable si está VIGENTE y fue registrado hoy (UTC)
function esAnulable(pago: PagoListadoItem): boolean {
  if (pago.estado !== 'VIGENTE') return false;
  const hoy = new Date();
  const fecha = new Date(pago.fechaCreacion);
  return (
    fecha.getUTCFullYear() === hoy.getUTCFullYear() &&
    fecha.getUTCMonth() === hoy.getUTCMonth() &&
    fecha.getUTCDate() === hoy.getUTCDate()
  );
}

// Abre un PDF protegido usando fetch+blob (Bearer auth no va por window.open)
async function abrirPdfProtegido(
  url: string,
  onError: (msg: string) => void,
) {
  try {
    const token = tokenStorage.getAccessToken();
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await fetch(`${base}${url}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) throw new Error('Error al obtener el PDF');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
  } catch {
    onError('No se pudo abrir el comprobante PDF.');
  }
}

// ===== LABELS MOTIVOS =====
const MOTIVOS: { value: AnularFormValues['motivo']; label: string }[] = [
  { value: 'ERROR_MONTO', label: 'Error de monto' },
  { value: 'CLIENTE_INCORRECTO', label: 'Cliente incorrecto' },
  { value: 'DUPLICADO', label: 'Pago duplicado' },
  { value: 'OTRO', label: 'Otro (especificar)' },
];

// ===== COMPONENTE PRINCIPAL =====
export function HistorialPagosTabla({
  pagos,
  total,
  cargando,
  pagina,
  porPagina,
  onCambiarPagina,
  onAnularPago,
}: Props) {
  const { showToast } = useToast();
  // null = dialog cerrado. PagoListadoItem = pago seleccionado para anular.
  const [pagoParaAnular, setPagoParaAnular] =
    useState<PagoListadoItem | null>(null);
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false);

  const totalPaginas = Math.ceil(total / porPagina);

  const handleConfirmarAnulacion = async (values: AnularFormValues) => {
    if (!pagoParaAnular) return;
    setProcesandoAnulacion(true);
    try {
      await onAnularPago(
        pagoParaAnular.idPago,
        values.motivo,
        values.motivo === 'OTRO' ? values.descripcion : undefined,
      );
      setPagoParaAnular(null);
    } finally {
      setProcesandoAnulacion(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {/* Encabezado de la tabla */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <span className="text-sm font-semibold text-white">
             Historial de Cobros en la Empresa
          </span>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: '#c9a227', color: '#0a0f0a' }}
          >
            {total}
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {[
                  'N° Recibo',
                  'Contrato',
                  'Cliente',
                  'Tipo',
                  'Monto',
                  'Cajero',
                  'Fecha',
                  'Estado',
                  'Acciones',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground last:text-center"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Cargando pagos...
                  </td>
                </tr>
              )}

              {!cargando && pagos.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron pagos con los filtros actuales.
                  </td>
                </tr>
              )}

              {!cargando &&
                pagos.map((pago, idx) => (
                  <tr
                    key={pago.idPago}
                    className={`border-b transition-colors last:border-b-0 hover:bg-muted/30 ${
                      idx % 2 !== 0 ? 'bg-muted/10' : ''
                    } ${pago.estado === 'ANULADO' ? 'opacity-60' : ''}`}
                  >
                    {/* N° Recibo */}
                    <td className="px-3 py-3 font-mono text-xs font-semibold">
                      {pago.nroRecibo}
                    </td>

                    {/* N° Contrato */}
                    <td className="px-3 py-3 font-mono text-sm">
                      {pago.nroContrato}
                    </td>

                    {/* Cliente */}
                    <td className="max-w-50 px-3 py-3">
                      <p className="truncate text-sm font-medium">
                        {pago.clienteNombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CI: {pago.clienteCi}
                      </p>
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${claseTipo(pago.tipoOperacion)}`}
                      >
                        {labelTipo(pago.tipoOperacion)}
                      </span>
                    </td>

                    {/* Monto */}
                    <td className="px-3 py-3 tabular-nums">
                      <p className="font-medium">
                        {fmt(pago.montoTotal)} {pago.monedaPago}
                      </p>
                      {pago.tasaCambio > 0 && pago.monedaPago === 'USD' && (
                        <p className="text-xs text-muted-foreground">
                          TC: {pago.tasaCambio.toFixed(2)}
                        </p>
                      )}
                    </td>

                    {/* Cajero */}
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {pago.cajeroNombre}
                    </td>

                    {/* Fecha */}
                    <td className="px-3 py-3 text-sm tabular-nums text-muted-foreground">
                      {formatearFechaHoraBolivia(pago.fechaCreacion)}
                    </td>

                    {/* Estado */}
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          pago.estado === 'VIGENTE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}
                      >
                        {pago.estado}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Imprimir comprobante (con leyenda COPIA si ya está VIGENTE) */}
                        <button
                          type="button"
                          title="Reimprimir comprobante"
                          onClick={() =>
                            void abrirPdfProtegido(
                              `${ENDPOINTS.pagos.comprobante(pago.idPago)}?copia=true`,
                              (msg) => showToast(msg, 'error'),
                            )
                          }
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {/* Anular: solo si es anulable (VIGENTE y es del día de hoy) */}
                        {esAnulable(pago) && (
                          <button
                            type="button"
                            title="Anular pago"
                            onClick={() => setPagoParaAnular(pago)}
                            className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {pagina} de {totalPaginas} · {total} registros
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCambiarPagina(pagina - 1)}
              disabled={pagina <= 1}
              className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onCambiarPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== DIALOG ANULACIÓN =====
          Radix desmonta Dialog.Content cuando open=false.
          Eso resetea el formulario interno naturalmente, sin useEffect.
          Es la misma razón por la que usamos render condicional en los modales
          del Sprint 1 para evitar la regla de useEffect + reset(). */}
      <Dialog.Root
        open={pagoParaAnular !== null}
        onOpenChange={(open) => {
          if (!open) setPagoParaAnular(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            {/* El contenido del Dialog incluye el formulario.
                Al desmontar (Dialog.Content fuera del DOM), el form se destruye. */}
            {pagoParaAnular && (
              <AnularPagoForm
                pago={pagoParaAnular}
                procesando={procesandoAnulacion}
                onSubmit={handleConfirmarAnulacion}
                onCancelar={() => setPagoParaAnular(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// ===== SUBCOMPONENTE: Formulario de anulación =====
// Separado en su propio componente para que el useForm tenga un ciclo
// de vida limpio: monta cuando el dialog abre, desmonta cuando cierra.

interface AnularPagoFormProps {
  pago: PagoListadoItem;
  procesando: boolean;
  onSubmit: (values: AnularFormValues) => Promise<void>;
  onCancelar: () => void;
}

function AnularPagoForm({
  pago,
  procesando,
  onSubmit,
  onCancelar,
}: AnularPagoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AnularFormValues>({
    resolver: zodResolver(anularSchema),
  });

  // useWatch en lugar de watch() para evitar warnings del React Compiler
  const motivoSeleccionado = useWatch({ control, name: 'motivo' });

  return (
    <>
      {/* Encabezado del dialog */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Dialog.Title className="text-base font-semibold text-foreground">
            Anular pago
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Recibo{' '}
            <span className="font-mono font-medium text-foreground">
              N° {pago.nroRecibo}
            </span>{' '}
            · Contrato {pago.nroContrato}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        </Dialog.Close>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Motivo de anulación */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Motivo de anulación
          </label>
          <div className="flex flex-col gap-2">
            {MOTIVOS.map((m) => (
              <label
                key={m.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-input px-3 py-2 text-sm transition-colors hover:bg-muted has-checked:border-[#1a3a1a] has-checked:bg-[#1a3a1a]/5"
              >
                <input
                  type="radio"
                  value={m.value}
                  {...register('motivo')}
                  className="accent-[#1a3a1a]"
                />
                {m.label}
              </label>
            ))}
          </div>
          {errors.motivo && (
            <p className="mt-1 text-xs text-red-500">{errors.motivo.message}</p>
          )}
        </div>

        {/* Descripción: solo visible si motivo = OTRO */}
        {motivoSeleccionado === 'OTRO' && (
          <div>
            <label
              htmlFor="descripcion-anular"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Descripción
            </label>
            <textarea
              id="descripcion-anular"
              rows={2}
              placeholder="Describe brevemente el motivo..."
              {...register('descripcion')}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.descripcion && (
              <p className="mt-1 text-xs text-red-500">
                {errors.descripcion.message}
              </p>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={procesando}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:bg-red-700"
          >
            {procesando ? 'Anulando...' : 'Confirmar anulación'}
          </button>
        </div>
      </form>
    </>
  );
}