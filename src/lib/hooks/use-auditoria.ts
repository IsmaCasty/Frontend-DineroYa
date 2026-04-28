// Hook para consultar la auditoria con filtros y paginacion server-side.
// Se re-ejecuta cuando cambian los filtros (incluyendo paginacion).
"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
    AuditoriaFiltros,
    AuditoriaPage,
} from "@/lib/api/types/auditoria.types";

interface UseAuditoriaResult {
    pagina: AuditoriaPage | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Helper para construir el query string a partir de los filtros.
// Solo incluye campos definidos (omite undefined, vacios, NaN).
function construirQuery(filtros: AuditoriaFiltros): Record<string, string> {
    const out: Record<string, string> = {};
    if (filtros.idCuenta !== undefined && !isNaN(filtros.idCuenta)) {
        out.idCuenta = String(filtros.idCuenta);
    }
    if (filtros.accion) out.accion = filtros.accion;
    if (filtros.idEntidad) out.idEntidad = filtros.idEntidad;
    if (filtros.desde) out.desde = filtros.desde;
    if (filtros.hasta) out.hasta = filtros.hasta;
    if (filtros.page !== undefined) out.page = String(filtros.page);
    if (filtros.pageSize !== undefined) out.pageSize = String(filtros.pageSize);
    return out;
}

export function useAuditoria(filtros: AuditoriaFiltros): UseAuditoriaResult {
    const [pagina, setPagina] = useState<AuditoriaPage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Serializamos los filtros a string para usar como dependencia del effect
    // de forma estable. Si pasaramos el objeto filtros, el effect se
    // dispararia en cada render aunque el contenido sea identico.
    const filtrosKey = JSON.stringify(filtros);

    const cargar = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const query = construirQuery(filtros);
            const data = await apiRequest<AuditoriaPage>(ENDPOINTS.admin.auditoria, {
                query,
            });
            setPagina(data);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.messages[0] ?? "No se pudo cargar la auditoria.");
            } else {
                setError("Error de red al consultar auditoria.");
            }
        } finally {
            setIsLoading(false);
        }
        // filtrosKey es la dependencia real. ESLint puede pedir filtros pero
        // eso causaria refetch infinito. Usamos eslint-disable para esta linea.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtrosKey]);

    // useEffect aqui es legitimo: sincronizacion con sistema externo (backend).
    // setState dentro de callback async, no sincronicamente en el body.
    useEffect(() => {
        void cargar();
    }, [cargar]);

    return { pagina, isLoading, error, refetch: cargar };
}