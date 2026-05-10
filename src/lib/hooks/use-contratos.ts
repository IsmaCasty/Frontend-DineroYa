"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ContratosListaResponse,
  ContratoListadoItem,
  ContratoEstado,
} from "@/lib/api/types/contrato.types";

export interface FiltrosContrato {
  nroContrato?: string;
  ci?: string;
  nombreCliente?: string;
  idCajero?: number;
  estado?: ContratoEstado;
  fechaDesde?: string;
  fechaHasta?: string;
  montoMin?: number;
  montoMax?: number;
}

// Un solo objeto de estado para que React no procese multiples re-renders.
// isLoading arranca en true porque al montar ya hay un fetch en curso.
interface ContratosState {
  contratos: ContratoListadoItem[];
  total: number;
  totalVigentes: number;
  totalVencidos: number;
  isLoading: boolean;
  error: string | null;
}

const ESTADO_INICIAL: ContratosState = {
  contratos: [],
  total: 0,
  totalVigentes: 0,
  totalVencidos: 0,
  isLoading: true,
  error: null,
};

interface UseContratosReturn extends ContratosState {
  page: number;
  pageSize: number;
  cambiarPagina: (nuevaPagina: number) => void;
  aplicarFiltros: (filtros: FiltrosContrato) => void;
  refetch: () => void;
}

export function useContratos(): UseContratosReturn {
  const [filtros, setFiltros] = useState<FiltrosContrato>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [refreshToken, setRefreshToken] = useState(0);

  //  el state de datos en un solo objeto: asi el setState se llama una sola vez por fetch completado, nunca en el cuerpo del useEffect.
  const [state, setState] = useState<ContratosState>(ESTADO_INICIAL);

  // Ref para detectar fetches obsoletos (cuando cambian los filtros antes
  // de que el fetch anterior termine). No necesitamos cancelar la promesa,
  // simplemente ignoramos el resultado si el fetch ya no es el actual.
  const fetchIdRef = useRef(0);

  const buildQueryString = useCallback(
    (f: FiltrosContrato, p: number): string => {
      const params = new URLSearchParams();
      params.set("pagina", String(p));
      params.set("limite", String(pageSize));
      if (f.nroContrato?.trim()) params.set("nroContrato", f.nroContrato.trim());
      if (f.ci?.trim()) params.set("ci", f.ci.trim());
      if (f.nombreCliente?.trim()) params.set("nombreCliente", f.nombreCliente.trim());
      if (f.idCajero) params.set("idCajero", String(f.idCajero));
      if (f.estado) params.set("estado", f.estado);
      if (f.fechaDesde) params.set("fechaDesde", f.fechaDesde);
      if (f.fechaHasta) params.set("fechaHasta", f.fechaHasta);
      if (f.montoMin != null) params.set("montoMin", String(f.montoMin));
      if (f.montoMax != null) params.set("montoMax", String(f.montoMax));
      return params.toString();
    },
    [pageSize]
  );

  // El useEffect solo orquesta el fetch. Nunca llama setState
  // en el cuerpo del efecto, solo en los callbacks .then y .catch.
  useEffect(() => {
    // Incrementar el id del fetch actual para detectar respuestas obsoletas.
    const currentFetchId = ++fetchIdRef.current;
    const qs = buildQueryString(filtros, page);

    // Tipo intermedio para evitar ambiguedad de JSX con genericos en .tsx
    type Resp = ContratosListaResponse;

    apiRequest<Resp>(`${ENDPOINTS.contratos.lista}?${qs}`)
      .then((data) => {
        // Si ya se inicio otro fetch mas nuevo, ignorar esta respuesta
        if (currentFetchId !== fetchIdRef.current) return;

        const vigentes = data.data.filter(
          (c) => c.estado === "VIGENTE" && c.diasHastaVencimiento >= 0
        ).length;
        const vencidos = data.data.filter(
          (c) => c.estado === "VIGENTE" && c.diasHastaVencimiento < 0
        ).length;

        // Un solo setState con todos los datos: sin cascada de renders
        setState({
          contratos: data.data,
          total: data.total,
          totalVigentes: vigentes,
          totalVencidos: vencidos,
          isLoading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (currentFetchId !== fetchIdRef.current) return;
        const msg =
          err instanceof Error ? err.message : "Error al cargar contratos";
        setState((prev) => ({ ...prev, isLoading: false, error: msg }));
      });
  }, [filtros, page, refreshToken, buildQueryString]);

  // Los callbacks de accion ponen isLoading en true ANTES de cambiar los
  // parametros que disparan el useEffect. Esto es correcto porque ocurre
  // en un evento de usuario, no en el cuerpo de un efecto.
  const aplicarFiltros = useCallback((nuevosFiltros: FiltrosContrato) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setFiltros(nuevosFiltros);
    setPage(1);
  }, []);

  const cambiarPagina = useCallback((nuevaPagina: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setPage(nuevaPagina);
  }, []);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setRefreshToken((t) => t + 1);
  }, []);

  return {
    ...state,
    page,
    pageSize,
    cambiarPagina,
    aplicarFiltros,
    refetch,
  };
}