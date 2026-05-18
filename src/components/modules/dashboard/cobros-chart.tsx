'use client';

import {
  ComposedChart, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatearFechaBolivia } from '@/lib/utils/fecha-bolivia';
import type { PuntoCobro } from '@/lib/api/types/reporte.types';

interface TooltipPayloadItem { name?: string; value?: number | string; color?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number; }

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const monto = Number(payload[0]?.value ?? 0);
  // cantidadPagos viene del segundo payload (Bar oculto)
  const cantidad = Number(payload[1]?.value ?? 0);
  return (
    <div className="bg-card border border-border rounded-md p-3 text-xs shadow-lg">
      {/* Usa el util de Bolivia para mostrar la fecha en dd/mm/yyyy */}
      <p className="font-semibold text-foreground mb-1">
        {formatearFechaBolivia(String(label))}
      </p>
      <p style={{ color: '#c9a227' }}>
        Bs. {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-muted-foreground">{cantidad} cobro{cantidad !== 1 ? 's' : ''}</p>
    </div>
  );
}

export function CobrosChart({ data }: { data: PuntoCobro[] }) {
  if (!data.length) {
    return (
      <div className="h-70 flex items-center justify-center text-muted-foreground text-sm">
        Sin cobros en los últimos 30 días
      </div>
    );
  }

  return (
    <div className="h-70 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="fecha"
            // Solo dd/mm en el eje para no saturar; tooltip muestra dd/mm/yyyy completo
            tickFormatter={(v: string) => {
              const parts = v.split('-');
              return `${parts[2]}/${parts[1]}`;
            }}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          {/* Un solo eje Y: el monto. Las barras usan el mismo eje así llegan al mismo nivel */}
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Área de monto cobrado: relleno dorado translúcido */}
          <Area
            type="monotone"
            dataKey="montoTotal"
            name="Monto BOB"
            stroke="#c9a227"
            fill="#c9a22718"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#c9a227' }}
          />
          {/* Barras delgadas del mismo dataKey → llegan exactamente al mismo punto que la línea */}
          <Bar
            dataKey="montoTotal"
            name="Monto"
            fill="#1a3a1a"
            opacity={0.55}
            barSize={15}
            radius={[2, 2, 0, 0]}
          />
          {/* Bar invisible solo para que cantidadPagos aparezca en el tooltip */}
          <Bar dataKey="cantidadPagos" hide />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}