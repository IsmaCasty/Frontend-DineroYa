// Claves bajo las que guardamos cada pedazo de informacion en localStorage.
// Prefijo 'dy_' (dinero ya) para no colisionar con otras apps en el mismo dominio.
const KEYS = {
  accessToken: 'dy_access_token',
  refreshToken: 'dy_refresh_token',
  user: 'dy_user',
} as const;

// Estructura del usuario autenticado que guardamos localmente.
// Coincide con lo que devuelve /auth/login -> user.
export interface AuthUser {
  id: number;
  userName: string;
  nombreCompleto: string;
  cargoActivo: {
    id: number;
    nombre: string;
  };
}

// Helpers para leer/escribir de forma type-safe.
// Se protegen contra ejecucion en SSR (donde window no existe).
// Next.js App Router renderiza en server por defecto, por eso el guard.

const isBrowser = (): boolean => typeof window !== 'undefined';

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEYS.accessToken);
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEYS.refreshToken);
  },

  getUser(): AuthUser | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  // Guarda los tres datos juntos para mantener consistencia.
  setAll(data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }): void {
    if (!isBrowser()) return;
    localStorage.setItem(KEYS.accessToken, data.accessToken);
    localStorage.setItem(KEYS.refreshToken, data.refreshToken);
    localStorage.setItem(KEYS.user, JSON.stringify(data.user));
  },

  // Actualiza solo los tokens (caso: despues de refresh).
  // El usuario no cambia porque el cargo activo sigue siendo el mismo.
  updateTokens(data: { accessToken: string; refreshToken: string }): void {
    if (!isBrowser()) return;
    localStorage.setItem(KEYS.accessToken, data.accessToken);
    localStorage.setItem(KEYS.refreshToken, data.refreshToken);
  },

  // Borra todo. Se usa en logout y cuando el refresh falla.
  clear(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(KEYS.accessToken);
    localStorage.removeItem(KEYS.refreshToken);
    localStorage.removeItem(KEYS.user);
  },

  // Tambien guardamos una cookie simple con un flag para que el middleware
  // de Next.js pueda saber si hay sesion sin acceder a localStorage
  // (el middleware corre en el edge, no tiene acceso a localStorage).
  // La cookie solo dice 'hay_sesion' o no, no contiene el token.
  setSessionCookie(activa: boolean): void {
    if (!isBrowser()) return;
    if (activa) {
      // Cookie sin httpOnly (solo flag), sin contenido sensible.
      // path=/ para que este disponible en toda la app.
      // 7 dias de vida (coincide con el refresh token).
      document.cookie = 'dy_session=active; path=/; max-age=604800; SameSite=Lax';
    } else {
      // Para borrar: max-age=0 la expira inmediatamente.
      document.cookie = 'dy_session=; path=/; max-age=0; SameSite=Lax';
    }
  },
};