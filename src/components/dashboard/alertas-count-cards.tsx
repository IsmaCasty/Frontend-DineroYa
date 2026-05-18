// frontend/src/components/dashboard/alertas-count-cards.tsx
// Seis tarjetas de conteo del estado de alertas.
// Componente puro de presentación: recibe datos ya cargados, no hace fetch.
// No necesita 'use client' porque no usa hooks ni APIs del browser.
import type { AlertaDashboardResponse } from '@/lib/api/types/pago.types';
interface Props {
  data: AlertaDashboardResponse;
}

interface TarjetaDato {
  label: string;
  valor: number;
  descripcion: string;
  claseColor: string;
}

export function AlertasCountCards({ data }: Props) {
  // Derivar el arreglo de tarjetas directamente desde props.
  // Sin useEffect ni estado: son datos calculados en render.
  const tarjetas: TarjetaDato[] = [
    {
      label: 'VENCIDOS',
      valor: data.vencidosTotal,
      descripcion: 'Contratos con saldo vencido',
      claseColor:
        data.vencidosTotal > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-muted-foreground',
    },
    {
      label: 'VENCEN HOY',
      valor: data.vencidoHoy,
      descripcion: 'Vencimiento es hoy',
      claseColor:
        data.vencidoHoy > 0
          ? 'text-red-500 dark:text-red-400'
          : 'text-muted-foreground',
    },
    {
      label: 'EN 1 DÍA',
      valor: data.proximos1Dia,
      descripcion: 'Vencen mañana',
      claseColor:
        data.proximos1Dia > 0
          ? 'text-orange-500 dark:text-orange-400'
          : 'text-muted-foreground',
    },
    {
      label: 'EN 7 DÍAS',
      valor: data.proximos7Dias,
      descripcion: 'Próximos 7 días',
      claseColor:
        data.proximos7Dias > 0
          ? 'text-amber-500 dark:text-amber-400'
          : 'text-muted-foreground',
    },
    {
      label: 'EN 15 DÍAS',
      valor: data.proximos15Dias,
      descripcion: 'Próximos 15 días',
      claseColor:
        data.proximos15Dias > 0
          ? 'text-yellow-500 dark:text-yellow-500'
          : 'text-muted-foreground',
    },
    {
      label: 'EN 30 DÍAS',
      valor: data.proximos30Dias,
      descripcion: 'Próximos 30 días',
      claseColor: 'text-blue-500 dark:text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tarjetas.map((t) => (
        <div
          key={t.label}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.label}
          </p>
          <p className={`mt-1 text-3xl font-bold tabular-nums ${t.claseColor}`}>
            {t.valor}
          </p>
          <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
            {t.descripcion}
          </p>
        </div>
      ))}
    </div>
  );
}