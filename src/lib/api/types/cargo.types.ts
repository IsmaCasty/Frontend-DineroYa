// Tipo del catalogo de cargos. Coincide con CargoCatalogoItem del backend.
export interface CargoCatalogo {
  id: number;
  nombre: string;
  descripcion: string | null;
}