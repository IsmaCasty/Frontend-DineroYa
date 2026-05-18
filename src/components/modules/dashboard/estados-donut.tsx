'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DistribucionEstado } from '@/lib/api/types/reporte.types';

const COLORES: Record<string, string> = {
  VIGENTE: '#22c55e',
  VENCIDO: '#ef4444',
  CANCELADO: '#6b7280',
  RENOVADO: '#f59e0b',
  YA_DEVUELTO: '#3b82f6',
};

interface Props {
  data: DistribucionEstado[];
}

export function EstadosDonut({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-70 flex items-center justify-center text-muted-foreground text-sm">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-70 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="estado"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORES[entry.estado] ?? '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip
            // value puede ser undefined en el tipo genérico de recharts; lo normalizamos.
            formatter={(value) => [`${Number(value) || 0} contratos`, '']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}