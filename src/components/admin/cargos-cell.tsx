// Renderiza la lista de cargos de un usuario como pills doradas pequeñas.
// Si no tiene cargos activos (caso anomalo), muestra un mensaje discreto.
import type { CargoAsignado } from "@/lib/api/types/usuario.types";
interface CargosCellProps {
  cargos: CargoAsignado[];
}

export function CargosCell({ cargos }: CargosCellProps) {
  if (cargos.length === 0) {
    return (
      <span className="text-xs italic text-muted-foreground">Sin cargos</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {cargos.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "rgba(201, 162, 39, 0.15)",
            color: "var(--color-dy-gold-600)",
            border: "1px solid rgba(201, 162, 39, 0.35)",
          }}
        >
          {c.nombre}
        </span>
      ))}
    </div>
  );
}