// Helpers de formateo de fechas en hora Bolivia (UTC-4).
// El backend siempre persiste y devuelve UTC. La conversión visual a hora Bolivia es responsabilidad exclusiva del frontend.

// Por qué Intl.DateTimeFormat y no toLocaleString a secas:
// - Intl es la API estándar oficial para internacionalización.
// - timeZone le indica el huso a usar sin depender de la TZ del navegador del usuario, que podría estar en otro país.
// - dateStyle/timeStyle son shortcuts que delegan al locale el formato preferido (en es-BO sale dd/mm/yyyy automaticamente).
//
// Documentación oficial:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

const TIMEZONE_BOLIVIA = "America/La_Paz";
const LOCALE_BOLIVIA = "es-BO";

// Formato compacto: dd/mm/yyyy hh:mm. Para tablas y listas donde el espacio
// es escaso. No incluye segundos para no saturar.
const formatterFechaHora = new Intl.DateTimeFormat("es-BO", {
  timeZone: TIMEZONE_BOLIVIA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Solo fecha: dd/mm/yyyy. Para campos donde la hora no aporta valor (fecha de nacimiento, fecha de creación visualizada en historial).
const formatterFecha = new Intl.DateTimeFormat(LOCALE_BOLIVIA, {
  timeZone: TIMEZONE_BOLIVIA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Formato largo: lunes 30 de abril de 2026, 15:30. Para detalles donde queremos legibilidad humana completa. Lo usa el detalle del cliente.
const formatterFechaLarga = new Intl.DateTimeFormat(LOCALE_BOLIVIA, {
  timeZone: TIMEZONE_BOLIVIA,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Recibe ISO string o Date. Si la entrada es invalida, devuelve "—" (em-dash) porque mostrar "Invalid Date" en pantalla queda muy feo y delata bugs.
// El "—" es un placeholder neutro estandar en sistemas administrativos.
function parsearODash(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const fecha = typeof input === "string" ? new Date(input) : input;
  if (isNaN(fecha.getTime())) return null;
  return fecha;
}

export function formatearFechaHoraBolivia(
  input: string | Date | null | undefined,
): string {
  const fecha = parsearODash(input);
  if (!fecha) return "—";
  return formatterFechaHora.format(fecha);
}

export function formatearFechaBolivia(
  input: string | Date | null | undefined,
): string {
  const fecha = parsearODash(input);
  if (!fecha) return "—";
  return formatterFecha.format(fecha);
}

export function formatearFechaLargaBolivia(
  input: string | Date | null | undefined,
): string {
  const fecha = parsearODash(input);
  if (!fecha) return "—";
  return formatterFechaLarga.format(fecha);
}

// Helper inverso: convierte una fecha visible (Date local) a ISO UTC para enviar al backend. 
// Lo usa el formulario de cliente al postear fechaNacimiento.
// Si la entrada ya es string YYYY-MM-DD lo deja tal cual porque el backend acepta ambos formatos en columnas DATE.
export function aISO(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  if (typeof input === "string") {
    return input;
  }
  return input.toISOString();
}