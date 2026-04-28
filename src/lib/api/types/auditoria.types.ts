// Tipos del modulo de auditoria. Coinciden con AuditoriaItem y AuditoriaPag del backend (ver auditoria.service.ts).
// Item individual de auditoria como llega del backend.
// fechaAccion viene como string ISO desde JSON; lo parseamos al mostrar.
export interface AuditoriaItem {
    id: number;
    fechaAccion: string;
    accion: string;
    idEntidad: string | null;
    datosAnteriores: string | null;
    datosNuevos: string | null;
    ipAddress: string | null;
    idCuenta: number | null;
    userName: string | null;
    nombreCompleto: string | null;
}

// Respuesta paginada del endpoint /admin/auditoria.
export interface AuditoriaPage {
    data: AuditoriaItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Filtros que se envian como query params al backend. Todos opcionales: si no se envian, no se filtra por ese campo.
export interface AuditoriaFiltros {
    idCuenta?: number;
    accion?: string;
    idEntidad?: string;
    // Strings ISO 8601 ("2026-04-26T00:00:00.000Z").
    desde?: string;
    hasta?: string;
    page?: number;
    pageSize?: number;
}