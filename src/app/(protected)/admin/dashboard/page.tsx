'use client';

import { useDashboard } from '@/lib/hooks/use-dashboard';
import { KpiCards } from '@/components/modules/dashboard/kpi-cards';
import { CobrosChart } from '@/components/modules/dashboard/cobros-chart';
import { EstadosDonut } from '@/components/modules/dashboard/estados-donut';
import { AlertasCriticas } from '@/components/modules/dashboard/alertas-criticas';
import { ContratosUrgentes } from '@/components/modules/dashboard/contratos-urgentes';
import { UltimosCobros } from '@/components/modules/dashboard/ultimos-cobros';
import { TopJoyas } from '@/components/modules/dashboard/top-joyas';
import { ResumenCajeros } from '@/components/modules/dashboard/resumen-cajeros';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import { formatearFechaHoraBolivia } from '@/lib/utils/fecha-bolivia';
import { ClientOnly } from '@/components/ui/client-only';

// Skeleton reutilizable para mostrar mientras carga cada sección.
function CardSkeleton({ h = 'h-48' }: { h?: string }) {
  return (
    <div className={`${h} bg-muted/30 rounded-lg animate-pulse`} />
  );
}

// Sección con título y contenido uniformes.
function Section({
  title,
  children,
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 ${fullWidth ? 'col-span-full' : ''}`}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { data, cobrosChart, loading, error, refresh } = useDashboard();

    // useMemo evita llamar Date.now() directamente en render (función impura).
    // Se recalcula cuando llegan datos nuevos del backend (refresh).
   // El inicializador lazy de useState corre una vez fuera del render path,
    // por eso el compilador acepta Date.now() aquí (no en useMemo).
    const [ahora, setAhora] = useState(() =>
    new Date(Date.now() - 4 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16),
    );

    // Handler que combina el refresh del hook con actualizar la hora visible.
    // Va a vivir en el botón "Actualizar". Date.now() es válido en event handlers.
    const handleRefresh = () => {
    refresh();
    setAhora(
        new Date(Date.now() - 4 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16),
    );
    };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 size={22} className="text-[#c9a227]" />
            <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen operativo en tiempo real | Actualizado {data ? formatearFechaHoraBolivia(data.fechaConsulta) : ahora} (BOL)
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* KPIs */}
      {loading || !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} h="h-24" />
          ))}
        </div>
      ) : (
        <KpiCards kpis={data.kpis} />
      )}

      {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 min-w-0">
                <Section title="Cobros últimos 30 días">
                {loading || !data ? (
                    <CardSkeleton h="h-[280px]" />
                ) : (
                    <ClientOnly>
                    <CobrosChart data={cobrosChart} />
                    </ClientOnly>
                )}
                </Section>
            </div>
            <div className="min-w-0">
                <Section title="Distribución de contratos">
                {loading || !data ? (
                    <CardSkeleton h="h-[280px]" />
                ) : (
                    <ClientOnly>
                    <EstadosDonut data={data.distribucionEstados} />
                    </ClientOnly>
                )}
                </Section>
            </div>
        </div>

      {/* Alertas y contratos urgentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title={`Alertas críticas (${data?.alertasCriticasDetalle.length ?? 0})`}>
          {loading || !data ? (
            <CardSkeleton h="h-40" />
          ) : (
            <AlertasCriticas alertas={data.alertasCriticasDetalle} />
          )}
        </Section>
        <Section title={`Contratos vencidos urgentes (${data?.contratosVencidosUrgentes.length ?? 0})`}>
          {loading || !data ? (
            <CardSkeleton h="h-40" />
          ) : (
            <ContratosUrgentes contratos={data.contratosVencidosUrgentes} />
          )}
        </Section>
      </div>

      {/* Últimos cobros y top joyas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Últimos cobros del día">
          {loading || !data ? (
            <CardSkeleton h="h-40" />
          ) : (
            <UltimosCobros cobros={data.ultimosCobros} />
          )}
        </Section>
        <Section title="Joyas más frecuentes">
          {loading || !data ? (
            <CardSkeleton h="h-40" />
          ) : (
            <TopJoyas topTiposJoya={data.topTiposJoya} topKilates={data.topKilates} />
          )}
        </Section>
      </div>

      {/* Resumen cajeros: el backend solo lo envía para Admin/Jefa.
          Si el array llega vacío (cajero), la sección no se muestra. */}
      {data && data.resumenCajeros.length > 0 && (
        <div className="grid grid-cols-1">
          <Section title="Resumen por cajero (hoy)" fullWidth>
            <ResumenCajeros cajeros={data.resumenCajeros} />
          </Section>
        </div>
      )}
    </div>
  );
}