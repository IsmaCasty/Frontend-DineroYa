// Tipos que reflejan EXACTAMENTE el contrato del backend (UsuarioListItem del UsuarioService de NestJS).
// Si el backend cambia su shape, hay que actualizar aqui para mantener la consistencia. 
// Cargo asignado a una cuenta. Estructura minima que devuelve el backend.
export interface CargoAsignado {
  id: number;
  nombre: string;
}
// Item de la lista de usuarios. UsuarioListItem del backend (ver application/services/usuario.service.ts).
// fechaAlta llega como string ISO desde JSON, lo parseamos cuando lo mostramos.
// No lo tipamos como Date porque desde fetch viene string.
export interface UsuarioListItem {
  idCuenta: number;
  userName: string;
  nombreCompleto: string;
  ci: string;
  estado: boolean;
  cargosActivos: CargoAsignado[];
  // ISO 8601: "2025-09-15T10:30:00.000Z"
  fechaAlta: string;
}