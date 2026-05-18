// Hook para los tres reportes exportables: contratos, pagos y diario.
// Cada función devuelve datos JSON o dispara una descarga de archivo.

'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { tokenStorage } from '@/lib/auth/token-storage';
import { useToast } from '@/lib/toast/use-toast';
import type {
  ReporteContratosResponse,
  ReportePagosResponse,
  ReporteDiarioResponse,
  FiltrosReporteContratos,
  FiltrosReportePagos,
  FiltrosReporteDiario,
} from '@/lib/api/types/reporte.types';

// Alias para evitar ambigüedad de genéricos en JSX.
type ContratosData = ReporteContratosResponse;
type PagosData = ReportePagosResponse;
type DiarioData = ReporteDiarioResponse;

// ─── Helper: construir query string solo con los params que tienen valor ───────

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? '?' + parts.join('&') : '';
}

// ─── Helper: descargar un archivo protegido (xlsx o pdf) ─────────────────────

async function descargarArchivo(
  url: string,
  nombreArchivo: string,
  token: string,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${baseUrl}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Error al descargar: ${res.status}`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useReportes() {
  const { showToast } = useToast();

  // Estado por sección para que los loadings no se mezclen.
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [loadingDiario, setLoadingDiario] = useState(false);

  // ─── Contratos ────────────────────────────────────────────────────────────

  const buscarContratos = useCallback(
    async (filtros: FiltrosReporteContratos): Promise<ContratosData | null> => {
      const token = tokenStorage.getAccessToken();
      if (!token) return null;

      setLoadingContratos(true);
      try {
        const qs = buildQuery({
          desde: filtros.desde,
          hasta: filtros.hasta,
          estado: filtros.estado,
        });
        const result = await apiRequest<ContratosData>(
          `${ENDPOINTS.reportes.contratos}${qs}`,
          { method: 'GET', },
        );
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar reporte de contratos';
        showToast(msg, 'error');
        return null;
      } finally {
        setLoadingContratos(false);
      }
    },
    [showToast],
  );

  const exportarContratosXlsx = useCallback(
    async (filtros: FiltrosReporteContratos) => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      setLoadingContratos(true);
      try {
        const qs = buildQuery({ desde: filtros.desde, hasta: filtros.hasta, estado: filtros.estado });
        const fecha = new Date().toISOString().split('T')[0];
        await descargarArchivo(
          `${ENDPOINTS.reportes.contratosExport}${qs}`,
          `reporte-contratos-${fecha}.xlsx`,
          token,
        );
        showToast('Archivo Excel descargado', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al exportar Excel';
        showToast(msg, 'error');
      } finally {
        setLoadingContratos(false);
      }
    },
    [showToast],
  );

  const exportarContratosPdf = useCallback(
    async (filtros: FiltrosReporteContratos) => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      setLoadingContratos(true);
      try {
        const qs = buildQuery({ desde: filtros.desde, hasta: filtros.hasta, estado: filtros.estado });
        const fecha = new Date().toISOString().split('T')[0];
        await descargarArchivo(
          `${ENDPOINTS.reportes.contratosPdf}${qs}`,
          `reporte-contratos-${fecha}.pdf`,
          token,
        );
        showToast('PDF descargado', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al exportar PDF';
        showToast(msg, 'error');
      } finally {
        setLoadingContratos(false);
      }
    },
    [showToast],
  );

  // ─── Pagos/Cobros ─────────────────────────────────────────────────────────

  const buscarPagos = useCallback(
    async (filtros: FiltrosReportePagos): Promise<PagosData | null> => {
      const token = tokenStorage.getAccessToken();
      if (!token) return null;

      setLoadingPagos(true);
      try {
        const qs = buildQuery({
          desde: filtros.desde,
          hasta: filtros.hasta,
          idCuentaEmpleado: filtros.idCuentaEmpleado,
        });
        const result = await apiRequest<PagosData>(
          `${ENDPOINTS.reportes.pagos}${qs}`,
          { method: 'GET', },
        );
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar reporte de pagos';
        showToast(msg, 'error');
        return null;
      } finally {
        setLoadingPagos(false);
      }
    },
    [showToast],
  );

  const exportarPagosXlsx = useCallback(
    async (filtros: FiltrosReportePagos) => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      setLoadingPagos(true);
      try {
        const qs = buildQuery({ desde: filtros.desde, hasta: filtros.hasta, idCuentaEmpleado: filtros.idCuentaEmpleado });
        const fecha = new Date().toISOString().split('T')[0];
        await descargarArchivo(
          `${ENDPOINTS.reportes.pagosExport}${qs}`,
          `reporte-cobros-${fecha}.xlsx`,
          token,
        );
        showToast('Archivo Excel descargado', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al exportar Excel';
        showToast(msg, 'error');
      } finally {
        setLoadingPagos(false);
      }
    },
    [showToast],
  );

  const exportarPagosPdf = useCallback(
    async (filtros: FiltrosReportePagos) => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      setLoadingPagos(true);
      try {
        const qs = buildQuery({ desde: filtros.desde, hasta: filtros.hasta, idCuentaEmpleado: filtros.idCuentaEmpleado });
        const fecha = new Date().toISOString().split('T')[0];
        await descargarArchivo(
          `${ENDPOINTS.reportes.pagosPdf}${qs}`,
          `reporte-cobros-${fecha}.pdf`,
          token,
        );
        showToast('PDF descargado', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al exportar PDF';
        showToast(msg, 'error');
      } finally {
        setLoadingPagos(false);
      }
    },
    [showToast],
  );

  // ─── Diario ───────────────────────────────────────────────────────────────

  const buscarDiario = useCallback(
    async (filtros: FiltrosReporteDiario): Promise<DiarioData | null> => {
      const token = tokenStorage.getAccessToken();
      if (!token) return null;

      setLoadingDiario(true);
      try {
        const qs = buildQuery({ fecha: filtros.fecha });
        const result = await apiRequest<DiarioData>(
          `${ENDPOINTS.reportes.diario}${qs}`,
          { method: 'GET', },
        );
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar reporte diario';
        showToast(msg, 'error');
        return null;
      } finally {
        setLoadingDiario(false);
      }
    },
    [showToast],
  );

  const exportarDiarioXlsx = useCallback(
    async (filtros: FiltrosReporteDiario) => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      setLoadingDiario(true);
      try {
        const qs = buildQuery({ fecha: filtros.fecha });
        const fecha = filtros.fecha ?? new Date().toISOString().split('T')[0];
        await descargarArchivo(
          `${ENDPOINTS.reportes.diarioExport}${qs}`,
          `reporte-diario-${fecha}.xlsx`,
          token,
        );
        showToast('Archivo Excel descargado', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al exportar Excel';
        showToast(msg, 'error');
      } finally {
        setLoadingDiario(false);
      }
    },
    [showToast],
  );

  const exportarDiarioPdf = useCallback(
    async (filtros: FiltrosReporteDiario) => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;

      setLoadingDiario(true);
      try {
        const qs = buildQuery({ fecha: filtros.fecha });
        const fecha = filtros.fecha ?? new Date().toISOString().split('T')[0];
        await descargarArchivo(
          `${ENDPOINTS.reportes.diarioPdf}${qs}`,
          `reporte-diario-${fecha}.pdf`,
          token,
        );
        showToast('PDF descargado', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al exportar PDF';
        showToast(msg, 'error');
      } finally {
        setLoadingDiario(false);
      }
    },
    [showToast],
  );

  return {
    // Contratos
    buscarContratos,
    exportarContratosXlsx,
    exportarContratosPdf,
    loadingContratos,

    // Pagos
    buscarPagos,
    exportarPagosXlsx,
    exportarPagosPdf,
    loadingPagos,

    // Diario
    buscarDiario,
    exportarDiarioXlsx,
    exportarDiarioPdf,
    loadingDiario,
  };
}