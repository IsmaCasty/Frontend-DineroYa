// frontend/src/components/dashboard/contratos-urgentes-tabla.tsx
// Tabla de contratos urgentes/vencidos con acción "Marcar alerta como atendida".
// El Dialog de Radix requiere 'use client'. Por eso este componente también lo lleva.
// La lógica de red vive en el page padre; aquí solo está el estado local del UI.
'use client';
import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Phone,
  X,
  Banknote,
} from 'lucide-react';
import type { ContratoUrgente } from '@/lib/api/types/pago.types';

interface Props {
  contratos: ContratoUrgente[];
  // La lógica de red vive en el page: recibimos un callback para no acoplar
  // este componente a apiRequest ni a los endpoints.
  onAlertaAtendida: (idContrato: number, nota: string) => Promise<void>;
}

// Función pura: calcula texto y color de la celda de días sin tocar el estado.
function obtenerEstiloDias(dias: number): {
  texto: string;
  claseColor: string;
} {
  if (dias < 0)
    return {
      texto: `${Math.abs(dias)}d mora`,
      claseColor: 'text-red-600 dark:text-red-400 font-semibold',
    };
  if (dias === 0)
    return {
      texto: 'Hoy',
      claseColor: 'text-red-500 dark:text-red-400 font-semibold',
    };
  if (dias === 1)
    return {
      texto: 'Mañana',
      claseColor: 'text-orange-500 dark:text-orange-400 font-semibold',
    };
  if (dias <= 7)
    return {
      texto: `${dias}d`,
      claseColor: 'text-amber-500 dark:text-amber-400 font-medium',
    };
  return { texto: `${dias}d`, claseColor: 'text-muted-foreground' };
}

function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

function formatearMonto(monto: number): string {
  return monto.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ContratosUrgentesTabla({ contratos, onAlertaAtendida }: Props) {
  // null = dialog cerrado. Objeto = contrato seleccionado para marcar atendida.
  // El reset de la nota se hace aquí en el handler, sin useEffect.
  const [contratoSeleccionado, setContratoSeleccionado] =
    useState<ContratoUrgente | null>(null);
  const [nota, setNota] = useState('');
  const [procesando, setProcesando] = useState(false);

  const abrirDialog = (contrato: ContratoUrgente) => {
    setNota('');
    setContratoSeleccionado(contrato);
  };

  // Cierra el dialog y limpia el estado local en un solo handler.
  // Sin useEffect: el reset ocurre de forma síncrona aquí.
  const cerrarDialog = () => {
    setContratoSeleccionado(null);
    setNota('');
  };

  const confirmarAtencion = async () => {
    if (!contratoSeleccionado) return;
    setProcesando(true);
    try {
      await onAlertaAtendida(contratoSeleccionado.idContrato, nota);
      cerrarDialog();
    } finally {
      setProcesando(false);
    }
  };

  if (contratos.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500 dark:text-green-400" />
        <p className="font-semibold text-foreground">Todo al día</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No hay contratos urgentes ni vencidos en este momento.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {/* Encabezado de la sección */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <AlertTriangle className="h-4 w-4" style={{ color: '#c9a227' }} />
          <span className="text-sm font-semibold text-white">
            Contratos urgentes y vencidos
          </span>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: '#c9a227', color: '#0a0f0a' }}
          >
            {contratos.length}
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {[
                  'Nro Contrato',
                  'Cliente',
                  'Teléfono',
                  'Vencimiento',
                  'Saldo BOB',
                  'Días',
                  'Acciones',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground last:text-center"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratos.map((c, idx) => {
                const { texto, claseColor } = obtenerEstiloDias(
                  c.diasHastaVencimiento,
                );
                return (
                  <tr
                    key={c.idContrato}
                    className={`border-b transition-colors last:border-b-0 hover:bg-muted/30 ${
                      idx % 2 !== 0 ? 'bg-muted/10' : ''
                    }`}
                  >
                    {/* Número de contrato */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium">
                        {c.nroContrato}
                      </span>
                    </td>

                    {/* Nombre del cliente */}
                    <td className="max-w-50 truncate px-4 py-3 font-medium">
                      {c.clienteNombre}
                    </td>

                    {/* Teléfono */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.clienteTelefono ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          {c.clienteTelefono}
                        </span>
                      ) : (
                        <span className="text-xs opacity-50">Sin dato</span>
                      )}
                    </td>

                    {/* Fecha de vencimiento */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatearFecha(c.fechaVencimiento)}
                    </td>

                    {/* Saldo capital */}
                    <td className="px-4 py-3 tabular-nums font-medium">
                      <span className="flex items-center gap-1">
                        <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatearMonto(c.saldoCapital)}
                      </span>
                    </td>

                    {/* Días: color cambia según urgencia */}
                    <td className={`px-4 py-3 tabular-nums ${claseColor}`}>
                      {texto}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/contratos/${c.idContrato}`}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Ver contrato"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => abrirDialog(c)}
                          className="rounded p-1.5 transition-colors hover:bg-muted"
                          style={{ color: '#c9a227' }}
                          title="Marcar alerta como atendida"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog: marcar alerta como atendida.
          open se controla por contratoSeleccionado !== null.
          onOpenChange cierra limpiando el estado sin useEffect. */}
      <Dialog.Root
        open={contratoSeleccionado !== null}
        onOpenChange={(open) => {
          if (!open) cerrarDialog();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            {/* Encabezado */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Marcar alerta como atendida
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Contrato{' '}
                  <span className="font-mono font-medium text-foreground">
                    {contratoSeleccionado?.nroContrato}
                  </span>{' '}
                  · {contratoSeleccionado?.clienteNombre}
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

            {/* Nota opcional */}
            <div className="mb-5">
              <label
                htmlFor="nota-atencion"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Nota{' '}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <textarea
                id="nota-atencion"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder="Ej: Se contactó al cliente por teléfono, confirmó pago para mañana..."
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => void confirmarAtencion()}
                disabled={procesando}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#1a3a1a' }}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}