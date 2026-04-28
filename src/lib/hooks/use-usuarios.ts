// Hook para cargar y gestionar la lista de usuarios desde el backend.
// Maneja: estado de carga, error, refetch manual, y mutaciones locales
// (toggle estado) sin tener que volver a llamar al backend para refrescar.
// Importante: el patron useEffect aqui es para FETCHING (sincronizacion con sistema externo: el backend), NO para inicializar state desde
// localStorage ni para reaccionar a otro state. Es un caso legitimo segun la doc oficial de React.
"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { UsuarioListItem } from "@/lib/api/types/usuario.types";

export interface UseUsuariosResult {
  usuarios: UsuarioListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Actualiza un usuario en la lista local sin re-fetch (optimistic UI).
  // Util cuando se hace toggle de estado: el backend confirma el cambio y solo necesitamos actualizar la fila correspondiente.
  actualizarUsuarioLocal: (usuario: UsuarioListItem) => void;
}

export function useUsuarios(): UseUsuariosResult {
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funcion de fetching aislada en useCallback para usar como refetch.
  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<UsuarioListItem[]>(
        ENDPOINTS.admin.usuarios,
      );
      setUsuarios(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.messages[0] ?? "No se pudo cargar la lista de usuarios.",
        );
      } else {
        setError("Error de red al cargar usuarios.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial. useEffect aqui es legitimo: sincronizamos con el backend (sistema externo a React), no inicializamos state local.
  // El setState ocurre dentro de un async callback, no sincronicamente en el body del effect, asi que no genera el warning de cascading.
  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Actualiza una fila local sin re-fetch. Se usa para toggle estado.
  const actualizarUsuarioLocal = useCallback((usuario: UsuarioListItem) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.idCuenta === usuario.idCuenta ? usuario : u)),
    );
  }, []);

  return {
    usuarios,
    isLoading,
    error,
    refetch: cargar,
    actualizarUsuarioLocal,
  };
}