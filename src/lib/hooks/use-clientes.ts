// Maneja la lista paginada de clientes con filtros server-side.
// A diferencia de los catalogos, NO cacheamos a nivel de modulo porque:
// 1. La lista puede ser grande (cientos de clientes reales).
// 2. Los filtros cambian frecuentemente durante la sesion.
// 3. Un cliente nuevo creado en otro turno/caja debe aparecer al refrescar.
// Cada cambio de filtro dispara un nuevo request al backend.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ClienteListItem,
  ClientesPaginadosResponse,
  BuscarClientesFiltros,
} from "@/lib/api/types/cliente.types";

export interface UseClientesResult {
  clientes: ClienteListItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  // Cambia la pagina activa. Dispara fetch al backend.
  cambiarPagina: (nuevaPagina: number) => void;
  // Aplica nuevos filtros y resetea a pagina 1.
  aplicarFiltros: (filtros: Omit<BuscarClientesFiltros, "page" | "pageSize">) => void;
  // Refresca con los filtros y pagina actuales.
  refetch: () => void;
  // Inserta o actualiza un cliente en la lista local sin refetch completo.
  upsertLocal: (cliente: ClienteListItem) => void;
}

const PAGE_SIZE = 10;

export function useClientes(): UseClientesResult {
  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros en ref para no incluirlos en las dependencias del useCallback.
  // Cambiar filtros siempre va acompanado de un fetch explicito.
  const filtrosRef = useRef<Omit<BuscarClientesFiltros, "page" | "pageSize">>({});

  const fetchClientes = useCallback(async (paginaActual: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Construimos los query params combinando filtros y paginacion.
      const params: Record<string, string> = {
        page: String(paginaActual),
        pageSize: String(PAGE_SIZE),
      };
      const f = filtrosRef.current;
      if (f.q) params.q = f.q;
      if (f.idZona !== undefined) params.idZona = String(f.idZona);
      if (f.estado !== undefined) params.estado = String(f.estado);

      const query = new URLSearchParams(params).toString();
      const data = await apiRequest<ClientesPaginadosResponse>(
        `${ENDPOINTS.clientes.base}?${query}`,
      );
      setClientes(data.data);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messages[0] ?? "No se pudieron cargar los clientes.");
      } else {
        setError("Error de red al cargar clientes.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial.
  useEffect(() => {
    void fetchClientes(1);
  }, [fetchClientes]);

  const cambiarPagina = useCallback(
    (nuevaPagina: number) => {
      setPage(nuevaPagina);
      void fetchClientes(nuevaPagina);
    },
    [fetchClientes],
  );

  const aplicarFiltros = useCallback(
    (filtros: Omit<BuscarClientesFiltros, "page" | "pageSize">) => {
      filtrosRef.current = filtros;
      setPage(1);
      void fetchClientes(1);
    },
    [fetchClientes],
  );

  const refetch = useCallback(() => {
    void fetchClientes(page);
  }, [fetchClientes, page]);

  const upsertLocal = useCallback((cliente: ClienteListItem) => {
    setClientes((actuales) => {
      const idx = actuales.findIndex((c) => c.id === cliente.id);
      if (idx >= 0) {
        const copia = actuales.slice();
        copia[idx] = cliente;
        return copia;
      }
      // Al crear uno nuevo lo insertamos al inicio. El total sube en 1.
      setTotal((t) => t + 1);
      return [cliente, ...actuales];
    });
  }, []);

  return {
    clientes,
    total,
    page,
    pageSize: PAGE_SIZE,
    isLoading,
    error,
    cambiarPagina,
    aplicarFiltros,
    refetch,
    upsertLocal,
  };
}