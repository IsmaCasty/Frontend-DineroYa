import type { TopTipoJoya, TopKilate } from '@/lib/api/types/reporte.types';

function fBob(n: number): string {
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function BarItem({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 truncate text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden min-w-0">
        <div className="h-2 rounded-full bg-[#c9a227] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-semibold text-foreground shrink-0">{value}</span>
      {sub && <span className="text-xs text-muted-foreground hidden lg:block">{sub}</span>}
    </div>
  );
}

export function TopJoyas({ topTiposJoya, topKilates }: { topTiposJoya: TopTipoJoya[]; topKilates: TopKilate[] }) {
  // Ordenar de mayor a menor por cantidad antes de calcular el máximo
  const joyasOrdenadas  = [...topTiposJoya].sort((a, b) => b.cantidadContratos - a.cantidadContratos);
  const kilatesOrdenados = [...topKilates].sort((a, b) => b.cantidadJoyas - a.cantidadJoyas);

  const maxJoya   = Math.max(...joyasOrdenadas.map((j) => j.cantidadContratos), 1);
  const maxKilate = Math.max(...kilatesOrdenados.map((k) => k.cantidadJoyas), 1);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Tipos más empeñados</p>
        <div className="flex flex-col gap-2">
          {joyasOrdenadas.length === 0
            ? <p className="text-xs text-muted-foreground">Sin datos</p>
            : joyasOrdenadas.map((j) => (
                <BarItem key={j.idTipoJoya} label={j.descripcion} value={j.cantidadContratos} max={maxJoya} sub={fBob(j.montoTotalPrestadoBob)} />
              ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Por kilate</p>
        <div className="flex flex-col gap-2">
          {kilatesOrdenados.length === 0
            ? <p className="text-xs text-muted-foreground">Sin datos</p>
            : kilatesOrdenados.map((k) => (
                <BarItem key={k.idKilate} label={`${k.valor}k`} value={k.cantidadJoyas} max={maxKilate} sub={fBob(k.montoTotalPrestadoBob)} />
              ))}
        </div>
      </div>
    </div>
  );
}