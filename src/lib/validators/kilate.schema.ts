// Dos schemas separados: uno para el CRUD completo (Admin) y otro para el endpoint dedicado de precio (Admin y Jefa).
// precioGramo: min 0.01 porque un precio de 0 no tiene sentido negocio.
// kilate: entero entre 1 y 24 porque es el rango fisico real del oro.
import { z } from "zod";
export const kilateSchema = z.object({
  kilate: z
    .number({ message: "Ingresa un numero valido" })
    .int("El kilate debe ser un numero entero")
    .min(1, "El kilate minimo es 1")
    .max(24, "El kilate maximo es 24"),
  precioGramo: z
    .number({ message: "Ingresa un numero valido" })
    .positive("El precio debe ser mayor a 0")
    .multipleOf(0.01, "Maximo dos decimales permitidos"),
});

export type KilateFormData = z.infer<typeof kilateSchema>; 

// Schema separado para el modal de "solo precio". Reutiliza la misma
// regla de precioGramo para no duplicar logica de validacion.
export const kilatePrecioSchema = z.object({
  precioGramo: kilateSchema.shape.precioGramo,
});

export type KilatePrecioFormData = z.infer<typeof kilatePrecioSchema>;