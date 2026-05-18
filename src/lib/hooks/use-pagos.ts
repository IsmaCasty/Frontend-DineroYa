'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
    PagoListadoItem,
    PagosListaResponse,
} from '@/lib/api/types/pago.types';
// Filtros disponibles en la pantalla de historial de pagos
export interface FiltrosPago {
    // Búsqueda por número de recibo exacto
    nroRecibo?: string;
    // Búsqueda por número de contrato
    nroContrato?: string;
    // Búsqueda por CI del cliente
    ci?: string;
    // Filtrar por tipo de operación
    tipoOperacion?: 'PAGO_INTERES' | 'AMORTIZACION' | 'CANCELACION' | '';
    // Filtrar por estado
    estado?: 'VIGENTE' | 'ANULADO' | '';
    // Rango de fechas en formato YYYY-MM-DD
    fechaDesde?: string;
    fechaHasta?: string;
}
const POR_PAGINA = 10;
// Hook para el listado paginado de pagos (historial de cobros).
// Igual que use-contratos: recarga automáticamente cuando cambian los filtros o la página.
export function usePagos(filtros: FiltrosPago, pagina: number) {
    const [data, setData] = useState<PagoListadoItem[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            // Construir query string con los filtros activos (omite vacíos)
            const params = new URLSearchParams();
            params.set('pagina', String(pagina));
            params.set('limite', String(POR_PAGINA));
            if (filtros.nroRecibo) params.set('nroRecibo', filtros.nroRecibo);
            if (filtros.nroContrato) params.set('nroContrato', filtros.nroContrato);
            if (filtros.ci) params.set('ci', filtros.ci);
            if (filtros.tipoOperacion) params.set('tipoOperacion', filtros.tipoOperacion);
            if (filtros.estado) params.set('estado', filtros.estado);
            if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
            const url = `${ENDPOINTS.pagos.lista}?${params.toString()}`;

            // Alias de tipo antes de usar en apiRequest para evitar ambigüedad del parser JSX
            type Resp = PagosListaResponse;
            const resp = await apiRequest<Resp>(url);

            setData(resp.data);
            setTotal(resp.total);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar pagos');
        } finally {
            setCargando(false);
        }
    }, [
        pagina,
        filtros.nroRecibo,
        filtros.nroContrato,
        filtros.ci,
        filtros.tipoOperacion,
        filtros.estado,
        filtros.fechaDesde,
        filtros.fechaHasta,
    ]);
    // Recarga cada vez que cambian los filtros o la página.
    // useEffect aquí es correcto: estamos lanzando un efecto secundario (llamada de red),
    // no derivando un estado de otro estado.
    useEffect(() => {
        void cargar();
    }, [cargar]);
    return { data, total, cargando, error, recargar: cargar, porPagina: POR_PAGINA };
}