// Hook para obtener los datos del dashboard en tiempo real.
// Se refresca automáticamente cada 2 minutos para mantener los KPIs actualizados.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { DashboardResponse, PuntoCobro } from '@/lib/api/types/reporte.types';

// Alias para evitar ambigüedad de genéricos en JSX.
type DashboardData = DashboardResponse;
type CobrosChartData = PuntoCobro[];

interface UseDashboardReturn {
  data: DashboardData | null;
  cobrosChart: CobrosChartData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cobrosChart, setCobrosChart] = useState<CobrosChartData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    // El cliente apiRequest inyecta el token automáticamente desde tokenStorage.
    // No se pasan headers manualmente.
    const [dashRes, chartRes] = await Promise.all([
      apiRequest<DashboardData>(ENDPOINTS.reportes.dashboard, {
        method: 'GET',
      }),
      apiRequest<CobrosChartData>(ENDPOINTS.reportes.cobrosChart(30), {
        method: 'GET',
      }),
    ]);

    setData(dashRes);
    setCobrosChart(chartRes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al cargar el dashboard';
    setError(msg);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchAll();

    // Auto-refresh cada 2 minutos.
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { data, cobrosChart, loading, error, refresh: fetchAll };
}