// Hook para cargar el catalogo de cargos desde el backend.
// Cachea el resultado en memoria a nivel de modulo para que multiples componentes que lo consumen no disparen multiples requests.
"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { CargoCatalogo } from "@/lib/api/types/cargo.types";

// Cache en memoria a nivel de modulo. Persiste entre montajes de componentes pero NO entre recargas de pagina. 
// Si necesitas cache persistente,considerar localStorage en el futuro (poco probable para este caso).
let cargosCache: CargoCatalogo[] | null = null;
let cargosPromise: Promise<CargoCatalogo[]> | null = null;

export interface UseCargosResult {
  cargos: CargoCatalogo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCargos(): UseCargosResult {
  // Inicializamos con el cache si ya existe.
  // Lazy init: el callback solo corre en el primer render del componente.
  const [cargos, setCargos] = useState<CargoCatalogo[]>(
    () => cargosCache ?? [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(cargosCache === null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (forzar = false): Promise<void> => {
    // Si tenemos cache valido y no se fuerza, no llamamos al backend.
    if (cargosCache && !forzar) {
      setCargos(cargosCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Si ya hay una request en curso, esperamos esa misma promesa.
    // Evita que dos componentes monten al mismo tiempo y disparen dos requests paralelos.
    if (!cargosPromise || forzar) {
      cargosPromise = apiRequest<CargoCatalogo[]>(ENDPOINTS.catalogos.cargos)
        .then((data) => {
          cargosCache = data;
          return data;
        })
        .finally(() => {
          cargosPromise = null;
        });
    }

    try {
      const data = await cargosPromise;
      setCargos(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messages[0] ?? "No se pudo cargar la lista de cargos.");
      } else {
        setError("Error de red al cargar cargos.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial. Caso legitimo de useEffect: sincronizacion con sistema externo (backend) usando setState en callback async.
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refetch = useCallback(() => cargar(true), [cargar]);

  return { cargos, isLoading, error, refetch };
}