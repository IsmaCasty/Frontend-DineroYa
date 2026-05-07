import { z } from 'zod';

// Schema de validacion del formulario de login.
// Zod es la libreria estandar para validacion en React con TS.
// Los mensajes estan en español para que el usuario los entienda.
export const loginSchema = z.object({
  userName: z
    .string()
    .min(1, { message: 'El usuario es obligatorio' })
    .max(20, { message: 'El usuario no puede superar 20 caracteres' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
    .max(20, { message: 'La contraseña no puede superar 20 caracteres' }),
});

export type LoginInput = z.infer<typeof loginSchema>;