// Mismo patron que use-tipos-joya. Sin cache de modulo porque la lista se muta desde esta misma pantalla y queremos estado fresco en cada montaje.
"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { Kilate } from "@/lib/api/types/catalogo.types";

export interface UseKilatesResult {
  kilates: Kilate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  upsertLocal: (kilate: Kilate) => void;
}

export function useKilates(): UseKilatesResult {
  const [kilates, setKilates] = useState<Kilate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Sin soloActivos: traemos todos para poder mostrar y reactivar inactivos.
      const data = await apiRequest<Kilate[]>(
        ENDPOINTS.catalogos.kilates + "?soloActivos=false",
      );
      setKilates(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messages[0] ?? "No se pudieron cargar los kilates.");
      } else {
        setError("Error de red al cargar kilates.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Mismo patron merge que acordamos: siempre recibe objeto completo porque el toggleEstado hace GET despues de cada mutacion.
  const upsertLocal = useCallback((kilate: Kilate) => {
    setKilates((actuales) => {
      const idx = actuales.findIndex((k) => k.id === kilate.id);
      if (idx >= 0) {
        const copia = actuales.slice();
        copia[idx] = kilate;
        return copia;
      }
      return [kilate, ...actuales];
    });
  }, []);

  return { kilates, isLoading, error, refetch: cargar, upsertLocal };
}