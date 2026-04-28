// Catalogo de acciones auditadas en el sistema. Coincide con los strings
// usados en los decoradores @Auditar() del backend.
// Si en el futuro agregas nuevas acciones (ej: en Sprint 2 con clientes,
// CREAR_CLIENTE, ACTUALIZAR_CLIENTE, etc.), suma aqui los items y aparece
// en el dropdown de la pantalla de auditoria automaticamente.
export interface AccionCatalogo {
    // Valor que se envia al backend como filtro.
    valor: string;
    // Etiqueta legible que ve el admin en el dropdown.
    etiqueta: string;
    // Modulo al que pertenece para agrupar visualmente en el dropdown.
    modulo: "Autenticacion" | "Usuarios" | "Cargos" | "Otros";
}

export const ACCIONES_AUDITORIA: AccionCatalogo[] = [
    // Autenticacion (auth.controller.ts)
    { valor: "LOGIN", etiqueta: "Iniciar Sesión", modulo: "Autenticacion" },
    {
        valor: "REFRESH_TOKEN",
        etiqueta: "Refrescar Token",
        modulo: "Autenticacion",
    },
    { valor: "LOGOUT", etiqueta: "Cerrar Sesión", modulo: "Autenticacion" },
    {
        valor: "CAMBIAR_PASSWORD",
        etiqueta: "Cambio de Contraseña",
        modulo: "Autenticacion",
    },

    // Gestion de usuarios (usuario-admin.controller.ts)
    {
        valor: "CREAR_USUARIO",
        etiqueta: "Crear Usuario",
        modulo: "Usuarios",
    },
    {
        valor: "ACTUALIZAR_USUARIO",
        etiqueta: "Actualizar Usuario",
        modulo: "Usuarios",
    },
    {
        valor: "RESET_PASSWORD",
        etiqueta: "Reset de Contraseña (Admin)",
        modulo: "Usuarios",
    },

    // Gestion de cargos
    { valor: "ASIGNAR_CARGO", etiqueta: "Asignar Cargo", modulo: "Cargos" },
    { valor: "REVOCAR_CARGO", etiqueta: "Revocar Cargo", modulo: "Cargos" },
];

// Helper para obtener la etiqueta legible de una accion. Si no esta en
// el catalogo (caso futuro de accion nueva sin actualizar el catalogo),
// devuelve el valor crudo como fallback.
export function obtenerEtiquetaAccion(valor: string): string {
    const accion = ACCIONES_AUDITORIA.find((a) => a.valor === valor);
    return accion?.etiqueta ?? valor;
}