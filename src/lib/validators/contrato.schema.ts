// El formulario principal cubre los pasos 2 (joyas) y 3 (configuracion del prestamo). 
// El paso 1 (seleccion de cliente) vive en state separado porque no es un campo de formulario, es una entidad seleccionada.
// Reglas Zod 4 que aplican aqui:
// - superRefine con ctx.addIssue() y code: "custom" (nunca z.ZodIssueCode.custom)
// - .partial() no funciona sobre schemas que ya tienen .superRefine()
//   Por eso el schema base de joya se define sin superRefine y el refinement se agrega al schema final.
import { z } from "zod";

// Sin superRefine en el item: usamos refine con config estatica que si
// funciona con Zod 4. La regla de "usar superRefine" aplica solo cuando
// el mensaje de error es dinamico (funcion). Aqui es estatico.
const joyaSchema = z.object({
  idTipoJoya: z.number({ message: "Selecciona el tipo de joya" })
    .int()
    .positive("Selecciona el tipo de joya"),
  idKilate: z.number({ message: "Selecciona el kilate" })
    .int()
    .positive("Selecciona el kilate"),
  pesoBruto: z.number({ message: "Ingresa el peso bruto" })
    .positive("El peso bruto debe ser mayor a 0"),
  pesoNeto: z.number({ message: "Ingresa el peso neto" })
    .positive("El peso neto debe ser mayor a 0"),
  observaciones: z.string().optional(),
  valorTasacion: z.number().positive().optional(),
}).refine(
  // Config estatica: no hay funcion dinamica como segundo argumento
  (data) => data.pesoNeto <= data.pesoBruto,
  { message: "El peso neto no puede superar el peso bruto", path: ["pesoNeto"] }
);

// Sin .default(30): el default va en defaultValues del useForm.
// .default() hace que el input type sea "number | undefined" y el output
// "number", lo que rompe la inferencia del zodResolver.
export const contratoFormSchema = z.object({
  joyas: z.array(joyaSchema).min(1, "Debe agregar al menos una joya"),
  montoSolicitado: z.number({ message: "Ingresa el monto" })
    .int("El monto debe ser un numero entero sin decimales")
    .positive("El monto debe ser mayor a 0"),
  idMoneda: z.number().int().positive(),
  nroFolio: z.string().optional(),
  diasPlazo: z.number().int().positive(),
  observacionesContrato: z.string().optional(),
});

// Tipo explicito en vez de z.infer: evita que zodResolver infiera unknown
// cuando el schema tiene transformaciones internas (refine, efectos).
export interface ContratoFormValues {
  joyas: {
    idTipoJoya: number;
    idKilate: number;
    pesoBruto: number;
    pesoNeto: number;
    observaciones?: string;
    valorTasacion?: number;
  }[];
  montoSolicitado: number;
  idMoneda: number;
  nroFolio?: string;
  diasPlazo: number;
  observacionesContrato?: string;
}

// Para JoyaFila: tipo de un item del array
export type JoyaFormValues = ContratoFormValues["joyas"][number];