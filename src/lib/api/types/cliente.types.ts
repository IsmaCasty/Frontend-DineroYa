// Tipos del módulo Clientes. Coinciden con los Response DTOs del backend.
// Enums del dominio. El backend los expone como string literales
// sobre la columna tipoDocumento.
export type TipoDocumento = "CI" | "PASAPORTE" | "RUN";
export type Genero = "M" | "F";

// Cliente listado: versión recortada que devuelve el endpoint paginado.
// No trae todos los campos para no inflar el response.
export interface ClienteListItem {
  id: number;
  ci: string;
  nombreCompleto: string;
  telefono: string | null;
  estado: boolean;
  fechaCreacion: string;
  zonaNombre: string | null;
  localidadNombre: string | null;
}

// Cliente detallado: versión completa que devuelve GET /:id y POST.
// Incluye todos los campos editables más los denormalizados de zona.
export interface ClienteDetalle {
  id: number;
  ci: string;
  tipoDocumento: TipoDocumento;
  paterno: string | null;
  materno: string | null;
  nombre: string;
  apellidoCasado: string | null;
  nombreCompleto: string;
  genero: Genero | null;
  nacionalidad: string | null;
  fechaNacimiento: string | null;
  nit: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  // Datos de ubicación denormalizados.
  // Si idZona es null, los nombres también vienen null.
  idZona: number | null;
  zonaNombre: string | null;
  idLocalidad: number | null;
  localidadNombre: string | null;
}

// Listado paginado: estructura estándar que devuelve el endpoint GET /clientes.
export interface ClientesPaginadosResponse {
  data: ClienteListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// Resumen agregado del historial. En Sprint 2 todos los conteos vienen 0 porque los stubs de prestamos/pagos/devoluciones están vacíos.
export interface ResumenHistorialCliente {
  totalPrestamos: number;
  totalPagos: number;
  totalDevoluciones: number;
  saldoPendienteTotal: number;
}

// Historial completo: cliente + arrays de operaciones.
// Los arrays prestamos/pagos/devoluciones son siempre [] hasta Sprint 3-4.
// Los tipamos como unknown[] para evitar promesas falsas: cuando llegue
// Sprint 3 los reemplazamos por tipos reales.
export interface HistorialCliente {
  cliente: ClienteDetalle;
  prestamos: unknown[];
  pagos: unknown[];
  devoluciones: unknown[];
  resumen: ResumenHistorialCliente;
}

// Payload de creación. Refleja el CrearClienteDto del backend.
// Los campos opcionales son los que el backend acepta como nullable.
export interface CrearClientePayload {
  ci: string;
  tipoDocumento: TipoDocumento;
  paterno?: string | null;
  materno?: string | null;
  nombre: string;
  apellidoCasado?: string | null;
  genero?: Genero | null;
  nacionalidad?: string | null;
  fechaNacimiento?: string | null;
  nit?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  idZona?: number | null;
}

// Edición parcial. PATCH acepta cualquier subset de campos.
export type ActualizarClientePayload = Partial<CrearClientePayload>;

// Filtros de búsqueda paginada. Coincide con BuscarClientesDto del backend.
export interface BuscarClientesFiltros {
  q?: string;
  idZona?: number;
  estado?: boolean;
  page?: number;
  pageSize?: number;
}

// Códigos de error del módulo. Los usamos para discriminar el manejo.
export const CODIGO_CLIENTE_DUPLICADO = "CLIENTE_DUPLICADO";
export const CODIGO_CLIENTE_NO_ENCONTRADO = "CLIENTE_NO_ENCONTRADO";

// Body que devuelve el backend cuando el CI ya existe (409).
// El frontend lo usa para mostrar el modal de duplicado con datos del existente.
export interface ClienteDuplicadoError {
  error: typeof CODIGO_CLIENTE_DUPLICADO;
  message: string;
  clienteExistente: ClienteDetalle;
}
