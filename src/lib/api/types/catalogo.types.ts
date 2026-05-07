// Tipos compartidos de los catálogos del Sprint 2.
// Coinciden exactamente con los Response DTOs del backend.

// Localidad: catalogo geográfico de primer nivel. En Sprint 2 es read-only, viene del seeder con La Paz y El Alto.
export interface Localidad {
  id: number;
  nombre: string;
  estado: boolean;
}

// Zona: subdivisión de una Localidad. En Sprint 2 es read-only.
// El backend la devuelve siempre con localidadNombre denormalizado para evitar lookups dobles en el frontend.
export interface Zona {
  id: number;
  nombre: string;
  estado: boolean;
  idLocalidad: number;
  localidadNombre: string;
}

// TipoJoya: catálogo administrable solo por Admin descripcion.
export interface TipoJoya {
  id: number;
  descripcion: string;
  estado: boolean;
}

// Kilate: catálogo administrable. Admin hace CRUD completo,
// Jefa solo puede actualizar el precioGramo (endpoint dedicado) precioGramo viene como number ya casteado por el backend.
// fechaActualizacion viene como ISO UTC y se formatea en hora Bolivia con el helper formatearFechaBolivia.
export interface Kilate {
  id: number;
  kilate: number;
  precioGramo: number;
  fechaActualizacion: string;
  estado: boolean;
}

// Payload para crear o editar tipo de joya. Solo descripcion, el backend setea estado=true al crear.
export interface CrearTipoJoyaPayload {
  descripcion: string;
}

export type ActualizarTipoJoyaPayload = Partial<CrearTipoJoyaPayload>;

// Payload de creación de kilate. No incluye fechaActualizacion porque
// la setea el backend con new Date() automáticamente.
export interface CrearKilatePayload {
  kilate: number;
  precioGramo: number;
}

// Edición completa. Ambos campos son opcionales por ser PATCH.
export type ActualizarKilatePayload = Partial<CrearKilatePayload>;

// Payload del endpoint dedicado /precio-gramo. Lo usa la Jefa semanalmente cuando cambia el precio del oro en el mercado.
export interface ActualizarPrecioGramoPayload {
  precioGramo: number;
}

// Códigos de error que el backend retorna en el body del 409. Los usamos para discriminar el manejo en cada modal.
export const CODIGO_CATALOGO_EN_USO = "CATALOGO_EN_USO";
export const CODIGO_CATALOGO_NO_ENCONTRADO = "CATALOGO_NO_ENCONTRADO";

// Body de error del 409 cuando un catálogo no se puede desactivar porque tiene registros activos asociados.
export interface CatalogoEnUsoError {
  error: typeof CODIGO_CATALOGO_EN_USO;
  registrosAsociados: number;
  message: string;
}