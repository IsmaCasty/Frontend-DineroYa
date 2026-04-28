'use client';
// Context global de autenticacion.
// Expone: user, isAuthenticated, login, logout, y acciones derivadas.
// Se usa via el hook useAuth() en cualquier componente cliente.
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import { tokenStorage, type AuthUser } from './token-storage';
import { apiRequest } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Respuestas esperadas del backend
interface LoginSuccessResponse {
  requiresCargoSelection: false;
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  user: AuthUser;
}

interface LoginRequiresCargoResponse {
  requiresCargoSelection: true;
  message: string;
  cargosDisponibles: { id: number; nombre: string }[];
}

type LoginResponse = LoginSuccessResponse | LoginRequiresCargoResponse;

// Resultado del login expuesto al componente llamador.
export type LoginResult =
  | { ok: true }
  | {
      ok: false;
      requiresCargoSelection: true;
      cargosDisponibles: { id: number; nombre: string }[];
    };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    userName: string,
    password: string,
    idCargo?: number,
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// Funcion pura que lee el estado inicial desde localStorage.
// Se pasa como inicializador lazy a useState para que corra una sola vez.
// En SSR (donde window no existe), retorna null sin explotar.
function leerUsuarioInicial(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  return tokenStorage.getUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializacion LAZY con funcion. React llama esta funcion una sola vez,
  // al primer render. NO dispara re-renders posteriores.
  // Esto reemplaza al useEffect que actualizaba el state desde localStorage.
  const [user, setUser] = useState<AuthUser | null>(leerUsuarioInicial);

  // isLoading queda en false desde el principio porque el estado ya esta
  // inicializado sincronicamente. No hay "cargando desde storage".
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Sincronizacion multi-pestaña: si el usuario hace logout en una pestaña,
  // las otras pestañas detectan el cambio de localStorage y actualizan su state.
  // Esto es un listener de eventos externos, que SI es un uso legitimo de useEffect.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: StorageEvent) => {
      // Solo nos importan los eventos de nuestras claves
      if (event.key === 'dy_user') {
        if (event.newValue === null) {
          setUser(null);
        } else {
          try {
            setUser(JSON.parse(event.newValue) as AuthUser);
          } catch {
            setUser(null);
          }
        }
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  
  // El login es un callback memoizado que maneja la logica de autenticacion.
  const login = useCallback(
    async (
      userName: string,
      password: string,
      idCargo?: number,
    ): Promise<LoginResult> => {
      const response = await apiRequest<LoginResponse>(
        ENDPOINTS.auth.login,
        {
          method: 'POST',
          body: { userName, password, idCargo },
          skipAuth: true,
        },
      );

      if (response.requiresCargoSelection) {
        return {
          ok: false,
          requiresCargoSelection: true,
          cargosDisponibles: response.cargosDisponibles,
        };
      }
      // Login exitoso: guardamos tokens y user en storage, y actualizamos el state.
      tokenStorage.setAll({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });
      tokenStorage.setSessionCookie(true);
      setUser(response.user);

      return { ok: true };
    },
    [],
  );
  // El logout tambien es un callback memoizado, aunque no recibe argumentos.
  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiRequest(ENDPOINTS.auth.logout, {
          method: 'POST',
          body: { refreshToken },
          skipAuth: true,
          skipRefreshOnUnauthorized: true,
        });
      } catch {
        // Ignorar: limpiamos localmente de todos modos
      }
    }

    tokenStorage.clear();
    tokenStorage.setSessionCookie(false);
    setUser(null);
    router.push('/login');
  }, [router]);

  // El value del contexto se memoriza para evitar re-renderizados innecesarios de los consumidores.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}