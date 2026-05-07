// Validacion del formulario de tipo de joya.
// El backend ademas valida unicidad pero eso no se puede chequear en cliente.
import { z } from "zod";
export const tipoJoyaSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(2, "La descripcion debe tener al menos 2 caracteres")
    .max(30, "La descripcion no puede superar 30 caracteres"),
});

export type TipoJoyaFormData = z.infer<typeof tipoJoyaSchema>;