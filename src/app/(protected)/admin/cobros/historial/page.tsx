// frontend/src/app/(protected)/admin/cobros/historial/page.tsx
// Pantalla de historial de pagos con filtros en tiempo real (RF-34).
// Permite reimprimir comprobantes y anular pagos del día actual.
'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { usePagos } from '@/lib/hooks/use-pagos';
import { HistorialPagosTabla } from '@/components/cobros/historial-pagos-tabla';
import type { FiltrosPago } from '@/lib/hooks/use-pagos';
import type { AnularPagoInput } from '@/lib/api/types/pago.types';

export default function HistorialCobrosPage() {
  const { showToast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosPago>({});
  const [pagina, setPagina] = useState(1);

  const { data, total, cargando, porPagina, recargar } = usePagos(
    filtros,
    pagina,
  );

  // Actualizar un filtro y resetear la paginación al inicio
  const actualizarFiltro = (campo: keyof FiltrosPago, valor: string) => {
    setPagina(1);
    setFiltros((prev) => ({ ...prev, [campo]: valor || undefined }));
  };

  const handleAnularPago = useCallback(
    async (id: number, motivo: string, descripcion?: string) => {
      try {
        const body: AnularPagoInput = { motivo, descripcion };
        await apiRequest(ENDPOINTS.pagos.anular(id), {
          method: 'POST',
          body: JSON.stringify(body),
        });
        showToast('Pago anulado correctamente.', 'success');
        void recargar();
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudo anular el pago.',
          'error',
        );
        // Re-lanzamos para que el dialog sepa que falló (no se cierra)
        throw e;
      }
    },
    [recargar, showToast],
  );

  return (
    <div className="flex flex-col gap-6 p-6">
        {/* Encabezado con flecha de regreso */}
        <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
            <Link
            href="/admin/cobros"
            className="mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Volver a Registrar Cobro"
            >
            <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Historial de Cobros
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
                Busca, reimprime y anula pagos registrados
            </p>
            </div>
        </div>
        <Link
            href="/admin/cobros"
            className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium"
            style={{
                backgroundColor: "var(--color-header-accent)",
            }}
        >
            <Plus className="h-4 w-4" />
            Volver a Registrar Cobro
        </Link>
        </div>

      {/* Filtros en tiempo real — sin botón Buscar */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* N° Recibo */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              N° Recibo
            </label>
            <input
              type="text"
              placeholder="Ej: 3189"
              value={filtros.nroRecibo ?? ''}
              onChange={(e) => actualizarFiltro('nroRecibo', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* N° Contrato */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              N° Contrato
            </label>
            <input
              type="text"
              placeholder="Ej: DYLP2SM260004"
              value={filtros.nroContrato ?? ''}
              onChange={(e) =>
                actualizarFiltro('nroContrato', e.target.value)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* CI del cliente */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              CI del cliente
            </label>
            <input
              type="text"
              placeholder="Número de CI..."
              value={filtros.ci ?? ''}
              onChange={(e) => actualizarFiltro('ci', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Tipo de operación */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Tipo
            </label>
            <select
              value={filtros.tipoOperacion ?? ''}
              onChange={(e) =>
                actualizarFiltro('tipoOperacion', e.target.value)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos los tipos</option>
              <option value="PAGO_INTERES">Pago de Interés</option>
              <option value="AMORTIZACION">Amortización</option>
              <option value="CANCELACION">Cancelación</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Estado
            </label>
            <select
              value={filtros.estado ?? ''}
              onChange={(e) => actualizarFiltro('estado', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          {/* Fecha desde */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Desde
            </label>
            <input
              type="date"
              value={filtros.fechaDesde ?? ''}
              onChange={(e) => actualizarFiltro('fechaDesde', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.fechaHasta ?? ''}
              onChange={(e) => actualizarFiltro('fechaHasta', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Tabla con ClientOnly por el Dialog de Radix */}
      <ClientOnly>
        <HistorialPagosTabla
          pagos={data}
          total={total}
          cargando={cargando}
          pagina={pagina}
          porPagina={porPagina}
          onCambiarPagina={setPagina}
          onAnularPago={handleAnularPago}
        />
      </ClientOnly>
    </div>
  );
}