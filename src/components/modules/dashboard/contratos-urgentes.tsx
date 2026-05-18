import type { ContratoVencidoUrgente } from '@/lib/api/types/reporte.types';

export function ContratosUrgentes({ contratos }: { contratos: ContratoVencidoUrgente[] }) {
  if (!contratos.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Sin contratos vencidos urgentes
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Contrato</th>
            <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
            <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Días</th>
            <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {contratos.map((c) => (
            <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="py-2 px-2 font-mono text-xs">{c.nroContrato}</td>
              <td className="py-2 px-2 truncate max-w-35">
                <p className="text-foreground">{c.clienteNombre}</p>
                <p className="text-xs text-muted-foreground">CI: {c.clienteCi}</p>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-bold ${c.diasVencido > 30 ? 'text-red-600' : c.diasVencido > 7 ? 'text-red-400' : 'text-orange-500'}`}>
                  {c.diasVencido}d
                </span>
              </td>
              <td className="py-2 px-2 text-right text-foreground font-medium text-xs">
                {c.saldoCapital.toLocaleString('es-BO', { minimumFractionDigits: 2 })} {c.moneda}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}