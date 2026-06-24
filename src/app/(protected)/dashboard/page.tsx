// frontend/src/app/(protected)/dashboard/page.tsx
// Dashboard principal — Alertas de vencimientos (RF-37).

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { useAuth } from '@/lib/auth/use-auth';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { AlertasCountCards } from '@/components/dashboard/alertas-count-cards';
import { ContratosUrgentesTabla } from '@/components/dashboard/contratos-urgentes-tabla';
import type {
  AlertaDashboardResponse,
} from '@/lib/api/types/pago.types';


export default function DashboardPage() {
  const { user } = useAuth();
  // showToast recibe (mensaje: string, tipo?: ToastType)
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AlertaDashboardResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      type Resp = AlertaDashboardResponse;
      const data = await apiRequest<Resp>(ENDPOINTS.pagos.alertasDashboard);
      setDashboardData(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Error al cargar el dashboard',
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  const manejarAlertaAtendida = useCallback(
    async (idContrato: number, nota: string) => {
      try {
        await apiRequest(
          ENDPOINTS.pagos.alertaAtenderContrato(idContrato),
          {
            method: 'PATCH',
            body: JSON.stringify(
              nota.trim() ? { nota: nota.trim() } : {},
            ),
          },
        );
        showToast('Contrato marcado como atendido.', 'success');
        void cargarDashboard();
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudo marcar la alerta.',
          'error',
        );
      }
    },
    [cargarDashboard, showToast],
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Alertas del Sistema
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {user
              ? ` ${user.nombreCompleto} | CARGO:  ${user.cargoActivo?.nombre ?? ''}`
              : 'Cargando...'}
          </p>
        </div>

        {dashboardData && dashboardData.alertasNoAtendidas > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800 dark:bg-amber-950/30">
            <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {dashboardData.alertasNoAtendidas} alerta
              {dashboardData.alertasNoAtendidas !== 1 ? 's' : ''} sin atender
            </span>
          </div>
        )}
      </div>

      {/* Cargando */}
      {cargando && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Cargando alertas...</span>
        </div>
      )}

      {/* Error */}
      {error && !cargando && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void cargarDashboard()}
            className="mt-2 text-sm font-medium text-red-700 underline dark:text-red-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido */}
      {dashboardData && !cargando && (
        <>
          <AlertasCountCards data={dashboardData} />
          <ClientOnly>
            <ContratosUrgentesTabla
              contratos={dashboardData.contratosUrgentes}
              onAlertaAtendida={manejarAlertaAtendida}
            />
          </ClientOnly>
        </>
      )}
    </div>
  );
}