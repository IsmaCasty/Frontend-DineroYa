// Carga la lista de tipos de joya y expone helpers para mutaciones locales que evitan refetch completo despues de cada accion.
// No cacheamos a nivel modulo (como en useCargos) porque esta lista se muta desde la misma pantalla: 
// queremos que cada montaje vea el estado actual del backend.
"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { TipoJoya } from "@/lib/api/types/catalogo.types";

export interface UseTiposJoyaResult {
  tipos: TipoJoya[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Insercion o actualizacion in-place. Si el id ya existe lo reemplaza, si no, lo agrega al inicio. Sirve tanto para crear como para editar.
  upsertLocal: (tipo: TipoJoya) => void;
}

export function useTiposJoya(): UseTiposJoyaResult {
  const [tipos, setTipos] = useState<TipoJoya[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Sin query param: traemos todos (activos e inactivos) y filtramos en cliente con el select de la pantalla.
      const data = await apiRequest<TipoJoya[]>(
        ENDPOINTS.catalogos.tiposJoya + "?soloActivos=false",
      );
      setTipos(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messages[0] ?? "No se pudieron cargar los tipos de joya.");
      } else {
        setError("Error de red al cargar tipos de joya.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Caso legitimo de useEffect: sincronizacion inicial con backend.
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const upsertLocal = useCallback((tipo: TipoJoya) => {
  setTipos((actuales) => {
    const idx = actuales.findIndex((t) => t.id === tipo.id);
    if (idx >= 0) {
      const copia = actuales.slice();
      copia[idx] = tipo;
      return copia;
    }
    return [tipo, ...actuales];
  });
}, []);

  return { tipos, isLoading, error, refetch: cargar, upsertLocal };
}