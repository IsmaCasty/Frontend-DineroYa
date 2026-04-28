// Schema zod para el formulario de cambio de contraseña.
// Replica EXACTAMENTE la politica del backend  para que el usuario reciba feedback inmediato sin esperar al servidor.
// Politica: minimo 8 chars, al menos 1 mayuscula, 1 minuscula, 1 numero,
// 1 caracter especial. Es la misma regex que el backend en modules/auth/dto/change-password.dto.ts (PASSWORD_REGEX).

import { z } from "zod";

// Lista de caracteres especiales aceptados. La copiamos del backend para
// mantener consistencia. Si cambias la politica en el backend, tambien hay que actualizar aqui.
const SPECIAL_CHARS_REGEX = /[@$!%*?&#.,;:_\-^(){}[\]+=|~`'"\\/<>]/;
const UPPER_REGEX = /[A-Z]/;
const LOWER_REGEX = /[a-z]/;
const DIGIT_REGEX = /\d/;

// Cada criterio se evalua por separado para poder mostrar al usuario
// CUAL especificamente esta fallando (en lugar de un mensaje generico).
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "La contraseña actual es obligatoria" }),

    newPassword: z
      .string()
      .min(8, { message: "Debe tener al menos 8 caracteres" })
      .refine((v) => UPPER_REGEX.test(v), {
        message: "Debe incluir al menos 1 mayuscula",
      })
      .refine((v) => LOWER_REGEX.test(v), {
        message: "Debe incluir al menos 1 minuscula",
      })
      .refine((v) => DIGIT_REGEX.test(v), {
        message: "Debe incluir al menos 1 numero",
      })
      .refine((v) => SPECIAL_CHARS_REGEX.test(v), {
        message: "Debe incluir al menos 1 caracter especial",
      }),

    confirmPassword: z
      .string()
      .min(1, { message: "Confirma la nueva contraseña" }),
  })
  // Validacion cruzada: confirm debe coincidir con newPassword.
  // path: ['confirmPassword'] hace que el error aparezca en ese campo.
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  // Validacion adicional: la nueva no puede ser igual a la actual.
  // No es del backend pero mejora UX evitando un viaje innecesario.
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Helper para evaluar criterios individuales en tiempo real.
// Se usa en el indicador visual de fortaleza para mostrar checks.
export interface CriterioPassword {
  cumple: boolean;
  texto: string;
}

export function evaluarCriterios(password: string): CriterioPassword[] {
  return [
    { cumple: password.length >= 8, texto: "Al menos 8 caracteres" },
    { cumple: UPPER_REGEX.test(password), texto: "Una mayuscula (A-Z)" },
    { cumple: LOWER_REGEX.test(password), texto: "Una minuscula (a-z)" },
    { cumple: DIGIT_REGEX.test(password), texto: "Un numero (0-9)" },
    {
      cumple: SPECIAL_CHARS_REGEX.test(password),
      texto: "Un caracter especial (@$!%*?&#...)",
    },
  ];
}