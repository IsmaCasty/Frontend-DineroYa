// Schema de alta de cliente. Las reglas de CI cambian segun tipoDocumento:
// - CI boliviano: solo digitos, 5 a 10 caracteres, con extension opcional separada por guion (ej: "1234567-1F").
// - PASAPORTE: alfanumerico 6 a 20 caracteres.
// - RUN: formato chileno con digito verificador (ej: "12345678-9").
// La validacion cruzada entre tipoDocumento y ci usa superRefine porque necesita acceder a dos campos simultaneamente.
// fechaNacimiento: obligatorio y mayor de 18 años al momento del registro.
import { z } from "zod";
// Helpers de validacion de CI por tipo de documento.
// Los separamos para que sean testeables de forma independiente.
function validarCIBoliviano(ci: string): boolean {
  // Acepta: solo digitos (ej: "1234567") o digitos + guion + extension alfanumerica (ej: "1234567-1F").
  // La extension es el complemento que imprime el SEGIP cuando hay dos personas con el mismo numero.
  return /^\d{5,10}(-[A-Za-z0-9]{1,3})?$/.test(ci);
}

function validarPasaporte(ci: string): boolean {
  return /^[A-Za-z0-9]{6,20}$/.test(ci);
}

function validarRUN(ci: string): boolean {
  // RUN chileno: 7-8 digitos + guion + digito verificador (0-9 o K).
  return /^\d{7,8}-[\dKk]$/.test(ci);
}

// Calcula si la fecha representa una persona mayor de 18 años.
// Usamos logica de fecha de cumpleanos exacta para no ser injustos
// con alguien que cumple años hoy.
function esMayorDeEdad(fechaStr: string): boolean {
  const nacimiento = new Date(fechaStr);
  if (isNaN(nacimiento.getTime())) return false;
  const hoy = new Date();
  const cumpleEsteAnio = new Date(
    hoy.getFullYear(),
    nacimiento.getMonth(),
    nacimiento.getDate(),
  );
  const edad =
    hoy.getFullYear() -
    nacimiento.getFullYear() -
    (hoy < cumpleEsteAnio ? 1 : 0);
  return edad >= 18;
}

// El objeto base sin superRefine. Lo exportamos para que clienteEditarSchema
// pueda hacer .partial() sin el error de Zod 4 que prohibe .partial() sobre
// schemas con refinements. Los refinements cruzados (CI segun tipo, mayoria
// de edad) se agregan solo al schema de alta donde son obligatorios.
const clienteBaseSchema = z.object({
  tipoDocumento: z.enum(["CI", "PASAPORTE", "RUN"], {
    message: "Selecciona el tipo de documento",
  }),
  ci: z
    .string()
    .trim()
    .min(1, "El numero de documento es obligatorio")
    .max(20, "El documento no puede superar 20 caracteres"),
  paterno: z.string().trim().max(30, "Maximo 30 caracteres").optional().or(z.literal("")),
  materno: z.string().trim().max(30, "Maximo 30 caracteres").optional().or(z.literal("")),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(30, "Maximo 30 caracteres"),
  apellidoCasado: z.string().trim().max(30, "Maximo 30 caracteres").optional().or(z.literal("")),
  genero: z.enum(["M", "F"]).optional().or(z.literal("")),
  nacionalidad: z.string().trim().max(20, "Maximo 20 caracteres").optional().or(z.literal("")),
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  nit: z.string().trim().max(30, "Maximo 30 caracteres").optional().or(z.literal("")),
  telefono: z.string().trim().max(20, "Maximo 20 caracteres").optional().or(z.literal("")),
  direccion: z.string().trim().max(50, "Maximo 50 caracteres").optional().or(z.literal("")),
  idLocalidad: z.number().nullable().optional(),
  idZona: z.number().nullable().optional(),
});

// Schema de alta: agrega los refinements cruzados sobre el objeto base.
export const clienteSchema = clienteBaseSchema.superRefine((data, ctx) => {
  const ci = data.ci.trim();
  if (data.tipoDocumento === "CI" && !validarCIBoliviano(ci)) {
    ctx.addIssue({
      code: "custom",
      path: ["ci"],
      message: "CI boliviano invalido. Formato: solo digitos (ej: 1234567) o con extension (ej: 1234567-1F).",
    });
  }
  if (data.tipoDocumento === "PASAPORTE" && !validarPasaporte(ci)) {
    ctx.addIssue({
      code: "custom",
      path: ["ci"],
      message: "Pasaporte invalido. Solo letras y numeros, 6 a 20 caracteres.",
    });
  }
  if (data.tipoDocumento === "RUN" && !validarRUN(ci)) {
    ctx.addIssue({
      code: "custom",
      path: ["ci"],
      message: "RUN invalido. Formato: 12345678-9 o 12345678-K.",
    });
  }
  if (data.fechaNacimiento && !esMayorDeEdad(data.fechaNacimiento)) {
    ctx.addIssue({
      code: "custom",
      path: ["fechaNacimiento"],
      message: "El cliente debe ser mayor de 18 anos para registrarse.",
    });
  }
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

// Schema de edicion: parte del objeto base sin refinements para poder / usar .partial().
// Los campos obligatorios en alta pasan a opcionales porque en edicion solo enviamos los campos que el usuario modifico.
export const clienteEditarSchema = clienteBaseSchema.partial({
  nombre: true,
  fechaNacimiento: true,
  tipoDocumento: true,
  ci: true,
});

export type ClienteEditarFormData = z.infer<typeof clienteEditarSchema>;