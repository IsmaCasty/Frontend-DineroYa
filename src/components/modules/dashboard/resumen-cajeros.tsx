import type { ResumenCajero } from '@/lib/api/types/reporte.types';

function fBob(n: number): string {
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
}

export function ResumenCajeros({ cajeros }: { cajeros: ResumenCajero[] }) {
  if (!cajeros.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Sin actividad de cajeros hoy
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1a3a1a] text-white">
            <th className="text-left py-2 px-3 text-xs font-semibold uppercase rounded-tl-md">Cajero</th>
            <th className="text-left py-2 px-3 text-xs font-semibold uppercase">Usuario</th>
            <th className="text-right py-2 px-3 text-xs font-semibold uppercase">Cobros hoy</th>
            <th className="text-right py-2 px-3 text-xs font-semibold uppercase">Monto cobrado</th>
            <th className="text-right py-2 px-3 text-xs font-semibold uppercase rounded-tr-md">Alertas pend.</th>
          </tr>
        </thead>
        <tbody>
          {cajeros.map((c) => (
            <tr key={c.idCuenta} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="py-2 px-3 font-medium text-foreground">{c.nombreCompleto}</td>
              <td className="py-2 px-3 text-xs text-muted-foreground font-mono">{c.userName}</td>
              <td className="py-2 px-3 text-right">
                <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-[#1a3a1a]/10 text-[#1a3a1a] dark:bg-white/10 dark:text-white text-xs font-bold">
                  {c.cobrosHoy}
                </span>
              </td>
              <td className="py-2 px-3 text-right font-mono text-sm font-bold text-[#c9a227]">
                {fBob(c.montoCobradoHoy)}
              </td>
              <td className="py-2 px-3 text-right">
                {c.alertasPendientes > 0 ? (
                  <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {c.alertasPendientes}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}