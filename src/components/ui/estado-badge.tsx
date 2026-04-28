// Badge visual para indicar estado activo/inactivo. Verde para activo,
// rojo apagado para inactivo. Texto siempre legible en ambos modos.
interface EstadoBadgeProps {
  activo: boolean;
}

export function EstadoBadge({ activo }: EstadoBadgeProps) {
  // Colores hardcoded porque el verde/rojo deben verse igual en claro
  // y oscuro. Son indicadores semanticos, no parte del tema.
  const config = activo
    ? { bg: "#dcfce7", text: "#166534", label: "Activo", dot: "#16a34a" }
    : { bg: "#fee2e2", text: "#991b1b", label: "Inactivo", dot: "#dc2626" };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dot }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}