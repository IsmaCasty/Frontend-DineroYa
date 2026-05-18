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
  
  // PDF del contrato (implementado en Sprint 4, RF-25)
  contratoPdf: (id: number) => `/contratos/${id}/pdf`,
  },

  // Módulo M4: Pagos, Cobros, Devoluciones y Caja (Sprint 4)
pagos: {
  // Tipo de cambio
  tipoCambioHoy: '/pagos/tipo-cambio/hoy',
  tipoCambioHistorial: '/pagos/tipo-cambio',
  tipoCambioCrear: '/pagos/tipo-cambio',
  // Preview de cálculo sin persistir (RF-32)
  calcular: '/pagos/calcular',

  // CRUD de pagos
  lista: '/pagos',
  crear: '/pagos',
  porId: (id: number) => `/pagos/${id}`,
  // GET con query ?copia=true para reimpresión con leyenda "COPIA"
  comprobante: (id: number) => `/pagos/${id}/comprobante`,
  anular: (id: number) => `/pagos/${id}/anular`,

  // Alertas (RF-36, RF-37, RF-38)
  alertasDashboard: '/pagos/alertas/dashboard',
  alertasLista: '/pagos/alertas',
  alertaAtender: (id: number) => `/pagos/alertas/${id}/atender`,

  // Devolución de joyas (RF-39, RF-40)
  devolucionCrear: '/pagos/devoluciones',
  devolucionComprobante: (id: number) => `/pagos/devoluciones/${id}/comprobante`,

  // Caja (RF-41, RF-42, RF-43)
  cajaAbrir: '/pagos/caja/abrir',
  cajaArqueo: '/pagos/caja/arqueo',
  cajaArqueoPdf: '/pagos/caja/arqueo/pdf',
  cajaCerrar: '/pagos/caja/cerrar',
  cajaSolicitudCrear: '/pagos/caja/solicitud-efectivo',
  cajaSolicitudGestionar: (id: number) => `/pagos/caja/solicitud-efectivo/${id}`,
  cajaTraspaso: '/pagos/caja/traspaso',
  montoAperturaSugerido: (idCuentaEmpleado: number) => `/pagos/caja/monto-apertura-sugerido?idCuentaEmpleado=${idCuentaEmpleado}`,
  },

  // ─── Reportes (Sprint 5) ──────────────────────────────────────────────────────
reportes: {
  dashboard: '/reportes/dashboard',
  cobrosChart: (dias: number) => `/reportes/dashboard/cobros-chart?dias=${dias}`,

  contratos: '/reportes/contratos',
  contratosExport: '/reportes/contratos/export',
  contratosPdf: '/reportes/contratos/pdf',

  pagos: '/reportes/pagos',
  pagosExport: '/reportes/pagos/export',
  pagosPdf: '/reportes/pagos/pdf',

  diario: '/reportes/diario',
  diarioExport: '/reportes/diario/export',
  diarioPdf: '/reportes/diario/pdf',
},
} as const;