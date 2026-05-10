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
    
    // Catalogos del Sprint 2.
    // Localidades y Zonas son read-only, no exponen mutaciones desde el frontend.
    localidades: "/catalogos/localidades",
    zonas: "/catalogos/zonas",

    // TipoJoya. CRUD completo, solo Admin lo usa salvo el GET.
    tiposJoya: "/catalogos/tipos-joya",
    tipoJoya: (id: number) => `/catalogos/tipos-joya/${id}`,
    tipoJoyaReactivar: (id: number) => `/catalogos/tipos-joya/${id}/reactivar`,

    // Kilate. CRUD completo (Admin) más endpoint dedicado de precio (Admin y Jefa).
    kilates: "/catalogos/kilates",
    kilate: (id: number) => `/catalogos/kilates/${id}`,
    kilatePrecio: (id: number) => `/catalogos/kilates/${id}/precio-gramo`,
    kilateReactivar: (id: number) => `/catalogos/kilates/${id}/reactivar`,
  },

  // Modulo de clientes. La mayoria son endpoints unicos, no funciones,
  // porque las URLs base no cambian. Las que reciben id si son funciones.
  clientes: {
    base: "/clientes",
    lista: "/clientes",
    porId: (id: number) => `/clientes/${id}`,
    historial: (id: number) => `/clientes/${id}/historial`,
    reactivar: (id: number) => `/clientes/${id}/reactivar`,
  },

  // Modulo M3: Contratos y Prestamos
contratos: {
  calcular: "/contratos/calcular",
  lista: "/contratos",
  crear: "/contratos",
  porId: (id: number) => `/contratos/${id}`,
  // POST: anular contrato (RF-27); cajero solo puede anular el mismo dia y el suyo
  anular: (id: number) => `/contratos/${id}/anular`,
  // PATCH: agregar observacion interna (RF-29); solo Jefa y Admin
  observaciones: (id: number) => `/contratos/${id}/observaciones`,
  // POST: adjudicar contrato vencido (RF-17); solo Jefa y Admin
  adjudicar: (id: number) => `/contratos/${id}/adjudicar`,
  },

} as const;