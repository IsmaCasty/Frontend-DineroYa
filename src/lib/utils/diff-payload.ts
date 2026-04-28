// Utilidad para construir el payload de un PUT/PATCH enviando SOLO los campos que cambiaron respecto a los valores originales.
// Esto evita reescribir datos que el usuario no toco y reduce el ruido en auditoria.
// Compara cada campo del objeto formulario con el original. Si difieren, incluye el campo en el payload de salida. Si son iguales, lo omite.
// El tipo de salida es Partial<T> porque cualquier subconjunto es valido.
export function construirPayloadDiff<T extends Record<string, unknown>>(
  original: T,
  formulario: T,
): Partial<T> {
  const diff: Partial<T> = {};

  for (const key of Object.keys(formulario) as Array<keyof T>) {
    const valorForm = formulario[key];
    const valorOrig = original[key];

    // Comparacion shallow. Funciona para strings, numbers, booleans.
    // Para objetos anidados haria falta deep equal (no es nuestro caso aqui).
    if (valorForm !== valorOrig) {
      diff[key] = valorForm;
    }
  }

  return diff;
}