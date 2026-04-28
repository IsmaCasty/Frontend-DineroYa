// Utilidades de fecha reutilizables en todos los formularios del sistema.
// La regla de mayoria de edad es 18 años (Codigo Civil boliviano).

// Cantidad minima de años para considerar a una persona mayor de edad.
// Se exporta como constante para usarse en mensajes de error consistentes.
export const EDAD_MINIMA_ANIOS = 18;

// Devuelve la fecha de hoy en formato YYYY-MM-DD que espera input type="date".
// Se usa para el atributo "max" del input, bloqueando seleccion futura.
export function hoyComoISODate(): string {
  const hoy = new Date();
  // toISOString() devuelve UTC. Para evitar que en zona horaria negativa
  // el "hoy" del navegador sea distinto al del servidor, usamos los
  // componentes locales explicitamente.
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Devuelve la fecha maxima permitida para un nacimiento de mayor de edad.
// Es decir: hoy menos EDAD_MINIMA_ANIOS exactos.
// Ejemplo: si hoy es 26/04/2026 y la edad minima es 18, devuelve 26/04/2008.
// Cualquier fecha posterior a esa hace que la persona sea menor de edad.
export function fechaMaximaParaMayorDeEdad(): string {
  const hoy = new Date();
  const limite = new Date(
    hoy.getFullYear() - EDAD_MINIMA_ANIOS,
    hoy.getMonth(),
    hoy.getDate(),
  );
  const yyyy = limite.getFullYear();
  const mm = String(limite.getMonth() + 1).padStart(2, "0");
  const dd = String(limite.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Devuelve una fecha minima razonable para nacimiento. Evita que el usuario
// ingrese fechas absurdas tipo "1800". 120 anios atras es un limite humano
// realista (la persona viva mas anciana documentada vivio 122 anios).
export function fechaMinimaNacimiento(): string {
  const hoy = new Date();
  const limite = new Date(
    hoy.getFullYear() - 120,
    hoy.getMonth(),
    hoy.getDate(),
  );
  const yyyy = limite.getFullYear();
  const mm = String(limite.getMonth() + 1).padStart(2, "0");
  const dd = String(limite.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Valida que una fecha (en formato YYYY-MM-DD del input type="date")
// corresponda a una persona mayor de edad. Devuelve un mensaje de error
// descriptivo, o null si la fecha es valida.
//
// Reglas que aplica:
//   1. La fecha debe ser parseable (formato valido).
//   2. No puede ser futura ni igual a hoy.
//   3. La persona debe tener al menos EDAD_MINIMA_ANIOS anios cumplidos.
//   4. No puede ser anormalmente antigua (mas de 120 anios).
//
// Importante para fechas: comparamos siempre con .getTime() o
// arithmetic con Date.now(), nunca date1 > date2 directo.
export function validarFechaNacimientoMayorEdad(
  fechaISO: string,
): string | null {
  if (!fechaISO) {
    // Vacio se trata como "no provisto". Si es obligatorio, eso lo
    // valida zod con .min(1) por separado.
    return null;
  }

  const fechaNac = new Date(fechaISO);
  if (isNaN(fechaNac.getTime())) {
    return "Fecha de nacimiento invalida";
  }

  const ahora = Date.now();

  // Regla 2: no futura ni igual a hoy.
  // .getTime() devuelve milisegundos. Comparamos numericos.
  if (fechaNac.getTime() >= ahora) {
    return "La fecha de nacimiento no puede ser hoy ni futura";
  }

  // Regla 4: no mas de 120 anios atras.
  const limiteAntiguo = new Date(fechaMinimaNacimiento()).getTime();
  if (fechaNac.getTime() < limiteAntiguo) {
    return "Fecha de nacimiento demasiado antigua";
  }

  // Regla 3: edad minima cumplida. Calculamos los anios completos.
  // Construimos la fecha "hoy hace N anios" y comparamos timestamps.
  const hoy = new Date();
  const fechaLimite = new Date(
    hoy.getFullYear() - EDAD_MINIMA_ANIOS,
    hoy.getMonth(),
    hoy.getDate(),
  );

  if (fechaNac.getTime() > fechaLimite.getTime()) {
    return `Debe ser mayor de ${EDAD_MINIMA_ANIOS} años`;
  }

  return null;
}

// Devuelve la fecha de hace N dias en formato ISO completo.
// Ej: hace1Dia() -> "2026-04-26T00:00:00.000Z" (asumiendo hoy = 27/04/26).
// Se usa para el filtro "ultimas N horas/dias" de la pantalla de auditoria.
export function fechaHaceNDias(dias: number): string {
  const ms = Date.now() - dias * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

// Devuelve el timestamp ISO actual. Wrapper conveniente.
export function ahoraISO(): string {
  return new Date().toISOString();
}

// Formatea una fecha ISO al formato local boliviano dd/mm/yyyy hh:mm.
// Se usa en tablas para mostrar fechas de forma legible.
export function formatearFechaHora(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}