// Localidades y zonas son catalogos read-only en Sprint 2. Los cacheamos a nivel de modulo porque no cambian durante la sesion:
// no hay UI para crearlos ni editarlos, vienen del seeder.
// El cache evita que cada montaje del selector Localidad->Zona  dispare un nuevo request al backend.
"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { Localidad, Zona } from "@/lib/api/types/catalogo.types";

// Cache a nivel modulo: persiste entre montajes, se limpia al recargar pagina.
let localidadesCache: Localidad[] | null = null;
let zonasCache: Zona[] | null = null;

export interface UseLocalidadesResult {
  localidades: Localidad[];
  zonas: Zona[];
  isLoading: boolean;
  error: string | null;
  // Devuelve las zonas filtradas por localidad. Si idLocalidad es null
  // devuelve array vacio porque el selector de zona debe estar deshabilitado.
  zonasPorLocalidad: (idLocalidad: number | null) => Zona[];
}

export function useLocalidades(): UseLocalidadesResult {
  const [localidades, setLocalidades] = useState<Localidad[]>(
    () => localidadesCache ?? [],
  );
  const [zonas, setZonas] = useState<Zona[]>(() => zonasCache ?? []);
  const [isLoading, setIsLoading] = useState(
    localidadesCache === null || zonasCache === null,
  );
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    // Si ambos caches tienen datos, no pedimos al backend.
    if (localidadesCache !== null && zonasCache !== null) {
      setLocalidades(localidadesCache);
      setZonas(zonasCache);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Pedimos localidades y todas las zonas en paralelo.
      // Las zonas sin filtro devuelven todas las activas (confirmado en Postman).
      const [locs, zns] = await Promise.all([
        apiRequest<Localidad[]>(ENDPOINTS.catalogos.localidades),
        apiRequest<Zona[]>(ENDPOINTS.catalogos.zonas),
      ]);
      localidadesCache = locs;
      zonasCache = zns;
      setLocalidades(locs);
      setZonas(zns);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messages[0] ?? "No se pudieron cargar las localidades.");
      } else {
        setError("Error de red al cargar localidades.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const zonasPorLocalidad = useCallback(
    (idLocalidad: number | null): Zona[] => {
      if (idLocalidad === null) return [];
      return zonas.filter((z) => z.idLocalidad === idLocalidad && z.estado);
    },
    [zonas],
  );

  return { localidades, zonas, isLoading, error, zonasPorLocalidad };
}