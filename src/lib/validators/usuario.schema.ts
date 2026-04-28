// Schemas zod para crear y editar usuario.
// Replican EXACTAMENTE las validaciones del backend en usuario.dto.ts.
import { z } from "zod";
import { validarFechaNacimientoMayorEdad } from "@/lib/utils/fecha";
// Misma regex que el backend (PASSWORD_REGEX en change-password.dto.ts).
const SPECIAL = /[@$!%*?&#.,;:_\-^(){}[\]+=|~`'"\\/<>]/;
const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /\d/;

// CI boliviano: solo numeros, opcionalmente seguido de guion y extension
// alfanumerica de 1 a 2 caracteres. Ejemplos validos: 1234567, 12345678,
// 1234567-1K, 9876543-LP. Longitud minima 5 (sin contar extension).
const CI_REGEX = /^\d{5,12}(-[A-Z0-9]{1,2})?$/;

// Schema base para los campos del empleado. Lo reutilizamos en crear y editar.
const empleadoBase = {
  ci: z
    .string()
    .min(1, { message: "El CI es obligatorio" })
    .regex(CI_REGEX, {
      message:
        "CI invalido. Use solo numeros, ej: 1234567 o 1234567-LP",
    }),

  paterno: z
    .string()
    .min(2, { message: "Minimo 2 caracteres" })
    .max(20, { message: "Maximo 20 caracteres" }),

  // Materno opcional: aceptar string vacio y transformarlo a undefined.
  materno: z
    .string()
    .max(20, { message: "Maximo 20 caracteres" })
    .optional()
    .or(z.literal("")),

  nombre: z
    .string()
    .min(2, { message: "Minimo 2 caracteres" })
    .max(20, { message: "Maximo 20 caracteres" }),

  // Genero como enum estricto. El backend espera 'M' o 'F'.
  genero: z.enum(["M", "F"], {
    message: "Selecciona un genero",
  }),

  // Fecha de nacimiento opcional, formato YYYY-MM-DD del input type="date".
  fechaNacimiento: z
  .string()
  .optional()
  .or(z.literal(""))
  // superRefine permite agregar issues custom con mensaje dinamico.
  // El callback recibe el valor ya parseado y un contexto con addIssue.
  // Si la fecha es invalida, agregamos un issue con el mensaje especifico
  // que devuelve el helper. Si es valida, no hacemos nada.
  .superRefine((valor, ctx) => {
    // Si esta vacio o undefined, no validamos (el campo es opcional).
    if (!valor) return;

    // El helper devuelve null si es valida, o un string con el motivo.
    const errorMensaje = validarFechaNacimientoMayorEdad(valor);
    if (errorMensaje !== null) {
      ctx.addIssue({
        code: "custom",
        message: errorMensaje,
      });
    }
  }),

  telefono: z
    .string()
    .max(20, { message: "Maximo 20 caracteres" })
    .optional()
    .or(z.literal("")),

  direccion: z
    .string()
    .max(50, { message: "Maximo 50 caracteres" })
    .optional()
    .or(z.literal("")),
};

// Schema para CREAR usuario. Incluye password e idCargos.
export const crearUsuarioSchema = z.object({
  ...empleadoBase,

  password: z
    .string()
    .min(8, { message: "Minimo 8 caracteres" })
    .refine((v) => UPPER.test(v), { message: "Falta una mayuscula" })
    .refine((v) => LOWER.test(v), { message: "Falta una minuscula" })
    .refine((v) => DIGIT.test(v), { message: "Falta un numero" })
    .refine((v) => SPECIAL.test(v), { message: "Falta un caracter especial" }),

  // Array de IDs de cargos. Minimo 1 cargo asignado al crear.
  idCargos: z
    .array(z.number().int().positive())
    .min(1, { message: "Asigna al menos un cargo" }),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

// Schema para EDITAR usuario. Todos los campos son opcionales.
// estado es boolean para activar/desactivar.
export const editarUsuarioSchema = z.object({
  ci: empleadoBase.ci.optional(),
  paterno: empleadoBase.paterno.optional(),
  materno: empleadoBase.materno,
  nombre: empleadoBase.nombre.optional(),
  genero: empleadoBase.genero.optional(),
  fechaNacimiento: empleadoBase.fechaNacimiento,
  telefono: empleadoBase.telefono,
  direccion: empleadoBase.direccion,
  estado: z.boolean().optional(),
});

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;

// Schema para reset de password (admin escribe la nueva).
export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Minimo 8 caracteres" })
    .refine((v) => UPPER.test(v), { message: "Falta una mayuscula" })
    .refine((v) => LOWER.test(v), { message: "Falta una minuscula" })
    .refine((v) => DIGIT.test(v), { message: "Falta un numero" })
    .refine((v) => SPECIAL.test(v), { message: "Falta un caracter especial" }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;