import type { AlertaCritica } from '@/lib/api/types/reporte.types';
import { AlertTriangle, Clock } from 'lucide-react';

export function AlertasCriticas({ alertas }: { alertas: AlertaCritica[] }) {
  if (!alertas.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Sin alertas críticas. Buen día operativo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alertas.map((a) => {
        const yaVencido = a.diasRestantes <= 0;
        return (
          <div
            key={a.id}
            className="flex items-start gap-3 p-3 rounded-md border border-border bg-background hover:bg-muted/30 transition-colors"
          >
            <span className={`mt-0.5 p-1 rounded-full ${yaVencido ? 'text-red-500 bg-red-50 dark:bg-red-950/20' : 'text-orange-500 bg-orange-50 dark:bg-orange-950/20'}`}>
              {yaVencido ? <AlertTriangle size={14} /> : <Clock size={14} />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{a.clienteNombre}</p>
              <p className="text-xs text-muted-foreground">
                Contrato {a.nroContrato} · Capital Bs. {a.montoCapital.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${yaVencido ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'}`}>
              {yaVencido ? `${Math.abs(a.diasRestantes)}d vencido` : `Vence hoy`}
            </span>
          </div>
        );
      })}
    </div>
  );
}