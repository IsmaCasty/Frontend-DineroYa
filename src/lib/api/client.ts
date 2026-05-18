// frontend/src/lib/api/client.ts
import { tokenStorage } from '../auth/token-storage';
import { API_URL, ENDPOINTS } from './endpoints';
import type { ClienteDuplicadoError } from "./types/cliente.types";
import type { CatalogoEnUsoError } from "./types/catalogo.types";

// Error tipado que exponemos a los componentes.
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly messages: string[],
    public readonly raw?: unknown,
  ) {
    super(messages.join(' | '));
    this.name = 'ApiError';
  }
}

// Error especifico de sesion expirada. Los componentes que lo detecten pueden
// redirigir al login. No redirigimos desde aca para evitar loops.
export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, ['Sesion expirada. Inicie sesion nuevamente.']);
    this.name = 'SessionExpiredError';
  }
}

interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

// Singleton de promesa de refresh. Si dos requests simultaneos detectan
// que el access expiro, solo UNO ejecuta el refresh y los otros esperan.
let refreshPromise: Promise<string> | null = null;

async function ejecutarRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clear();
    tokenStorage.setSessionCookie(false);
    throw new SessionExpiredError();
  }

  const resp = await fetch(`${API_URL}${ENDPOINTS.auth.refresh}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!resp.ok) {
    tokenStorage.clear();
    tokenStorage.setSessionCookie(false);
    throw new SessionExpiredError();
  }

  const data = (await resp.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  tokenStorage.updateTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data.accessToken;
}

async function obtenerAccessToken(forzarRefresh = false): Promise<string | null> {
  if (!forzarRefresh) {
    const actual = tokenStorage.getAccessToken();
    if (actual) return actual;
  }

  if (!refreshPromise) {
    refreshPromise = ejecutarRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  skipAuth?: boolean;
  skipRefreshOnUnauthorized?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

// Construye la URL completa con query params si se proveen.
function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const base = `${API_URL}${path}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Funcion principal de este cliente: apiRequest. Maneja autenticacion, refresh y errores.
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    skipAuth = false,
    skipRefreshOnUnauthorized = false,
    query,
  } = options;

  // Construimos la URL completa con query params si se proveen.
  const url = buildUrl(path, query);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Agregamos el token de autenticacion si no se omite.
  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let resp = await fetch(url, {
    method,
    headers,
    // Si body ya es string (JSON.stringify del caller), lo pasamos tal cual.
    // Si es un objeto, lo stringificamos nosotros. Evita doble JSON.stringify.
    body: body !== undefined
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : undefined, //1
  });

  // Auto-refresh si es 401, no hay skipAuth y no estamos en un endpoint de auth publico (login/refresh/logout) que podria causar loop.
  if (resp.status === 401 && !skipAuth && !skipRefreshOnUnauthorized) {
    let nuevoToken: string | null = null;

    try {
      nuevoToken = await obtenerAccessToken(true);
    } catch {
      // El refresh fallo: limpiamos y lanzamos SessionExpiredError.
      // La redireccion la hace el componente que capture el error,
      // NO este cliente (para evitar loops).
      throw new SessionExpiredError();
    }
    // Si obtenemos un nuevo token, reintentamos la request original una sola vez con el nuevo token.
    if (nuevoToken) {
      headers.Authorization = `Bearer ${nuevoToken}`;
      resp = await fetch(url, {
        method,
        headers,
        // Si body ya es string (JSON.stringify del caller), lo pasamos tal cual.
        // Si es un objeto, lo stringificamos nosotros. Evita doble JSON.stringify.
        body: body !== undefined
          ? (typeof body === 'string' ? body : JSON.stringify(body))
          : undefined, //2
      });
    }
  }

  // Parseamos el body si corresponde
  let parsed: unknown = null;
  const contentType = resp.headers.get('content-type') ?? '';
  if (resp.status !== 204 && contentType.includes('application/json')) {
    parsed = await resp.json();
  }

  if (!resp.ok) {
    const err = parsed as NestErrorBody | null;
    const messages: string[] = err?.message
      ? Array.isArray(err.message)
        ? err.message
        : [err.message]
      : [`Error HTTP ${resp.status}`];
    throw new ApiError(resp.status, messages, parsed);
  }

  return parsed as T;
}

// Devuelve el codigo de error si el backend lo incluyo en el body, o null
// si el error fue genérico (por ejemplo, un 500 sin body estructurado).
export function obtenerCodigoError(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.raw as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return null;
  const codigo = body["error"];
  return typeof codigo === "string" ? codigo : null;
}

// Type guards para los 409 conocidos. Los usamos en los modales para
// extraer el payload tipado sin castear a mano.
export function esErrorClienteDuplicado(
  error: unknown,
): error is ApiError & { raw: ClienteDuplicadoError } {
  if (!(error instanceof ApiError)) return false;
  if (error.statusCode !== 409) return false;
  return obtenerCodigoError(error) === "CLIENTE_DUPLICADO";
}

export function esErrorCatalogoEnUso(
  error: unknown,
): error is ApiError & { raw: CatalogoEnUsoError } {
  if (!(error instanceof ApiError)) return false;
  if (error.statusCode !== 409) return false;
  return obtenerCodigoError(error) === "CATALOGO_EN_USO";
}