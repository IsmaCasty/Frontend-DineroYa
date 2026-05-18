import { formatearFechaBolivia } from '@/lib/utils/fecha-bolivia';
import type { UltimoCobro } from '@/lib/api/types/reporte.types';

const CONCEPTO_COLOR: Record<string, string> = {
  AMORTIZACION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELACION:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PAGO_INTERES: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const CONCEPTO_LABEL: Record<string, string> = {
  AMORTIZACION: 'Amortización',
  CANCELACION:  'Cancelación',
  PAGO_INTERES: 'Interés',
};

export function UltimosCobros({ cobros }: { cobros: UltimoCobro[] }) {
  if (!cobros.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Sin cobros registrados hoy
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {cobros.map((c) => (
        <div key={c.id} className="py-2.5 flex items-center gap-3">
          <span className="w-2 h-8 rounded-sm shrink-0 bg-[#c9a227]" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.clienteNombre}</p>
            <p className="text-xs text-muted-foreground">
              {c.nroContrato} | {formatearFechaBolivia(c.fechaPago)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-bold text-foreground">
              Bs. {c.montoPagado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CONCEPTO_COLOR[c.concepto] ?? 'bg-gray-100 text-gray-600'}`}>
              {CONCEPTO_LABEL[c.concepto] ?? c.concepto}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}