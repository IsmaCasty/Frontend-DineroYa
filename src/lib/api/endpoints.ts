// URL base del backend, tomada del .env.local.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Endpoints centralizados. Si cambia alguno, se cambia en un solo lugar.
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
  },
  admin: {
    // GET lista todos los usuarios
    usuarios: '/admin/usuarios',
    // PUT actualiza un usuario por id (estado, datos, etc.)
    usuario: (id: number) => `/admin/usuarios/${id}`,
    // POST asigna cargo, DELETE revoca cargo
    asignarCargo: (id: number) => `/admin/usuarios/${id}/cargos`,
    revocarCargo: (id: number, idCargo: number) =>
      `/admin/usuarios/${id}/cargos/${idCargo}`,
    // PUT resetea contraseña
    resetPassword: (id: number) => `/admin/usuarios/${id}/reset-password`,
    auditoria: '/admin/auditoria',
  },
  // Sumar dentro del objeto ENDPOINTS:
catalogos: {
  cargos: "/catalogos/cargos",
},
} as const;