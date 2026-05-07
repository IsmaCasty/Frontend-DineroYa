// La tabla de kilates tiene logica de permisos por fila:
// - Admin ve tres botones: editar completo, actualizar precio, toggle estado.
// - Jefa ve solo un boton: actualizar precio.
// Los botones se renderizan condicionalmente segun el rol activo del usuario que viene de useAuth().
// Asi evitamos rutas de API que el backend ya protege, pero ademas damos feedback visual claro antes de que el usuario intente algo.
// formatearFechaHoraBolivia convierte el UTC del backend a hora Bolivia (UTC-4).
"use client";
import { useState } from "react";
import { Loader2, Pencil, Power, TrendingUp } from "lucide-react";
import {
  apiRequest,
  ApiError,
  esErrorCatalogoEnUso,
} from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { useAuth } from "@/lib/auth/use-auth";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { CatalogoEnUsoModal } from "@/components/catalogos/catalogo-en-uso-modal";
import { formatearFechaHoraBolivia } from "@/lib/utils/fecha-bolivia";
import { ROLES } from "@/lib/sidebar/sidebar-items";
import type { Kilate } from "@/lib/api/types/catalogo.types";

interface KilatesTablaProps {
  kilates: Kilate[];
  onEditarCompleto: (kilate: Kilate) => void;
  onActualizarPrecio: (kilate: Kilate) => void;
  onActualizado: (kilate: Kilate) => void;
}

export function KilatesTabla({
  kilates,
  onEditarCompleto,
  onActualizarPrecio,
  onActualizado,
}: KilatesTablaProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Determinamos el rol activo una sola vez para toda la tabla.
  const esAdmin = user?.cargoActivo?.nombre === ROLES.ADMINISTRADOR;

  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [bloqueo, setBloqueo] = useState<{
    kilate: Kilate;
    registrosAsociados: number;
  } | null>(null);

  const toggleEstado = async (kilate: Kilate) => {
    setTogglingIds((prev) => new Set(prev).add(kilate.id));
    try {
        if (kilate.estado) {
        await apiRequest<unknown>(
            ENDPOINTS.catalogos.kilate(kilate.id),
            { method: "DELETE" },
        );
        } else {
        await apiRequest<unknown>(
            ENDPOINTS.catalogos.kilateReactivar(kilate.id),
            { method: "PUT" },
        );
        }
        // Igual que TipoJoya: GET del objeto completo despues de la mutacion.
        let actualizado: Kilate;
        try {
        actualizado = await apiRequest<Kilate>(
            ENDPOINTS.catalogos.kilate(kilate.id),
        );
        } catch {
        // Si el GET falla (ej: backend filtra inactivos y devuelve 404),
        // construimos el objeto localmente con el estado nuevo.
        actualizado = { ...kilate, estado: !kilate.estado };
        }
        showToast(
        `Kilate ${kilate.kilate}k ${kilate.estado ? "desactivado" : "reactivado"} correctamente.`,
        "success",
        );
        onActualizado(actualizado);
    } catch (err) {
        if (esErrorCatalogoEnUso(err)) {
        setBloqueo({
            kilate,
            registrosAsociados:
            (err.raw as { registrosAsociados?: number }).registrosAsociados ?? 0,
        });
        } else if (err instanceof ApiError) {
        showToast(err.messages[0] ?? "No se pudo cambiar el estado.", "error");
        } else {
        showToast("Error de red al cambiar el estado.", "error");
        }
    } finally {
        setTogglingIds((prev) => {
        const copia = new Set(prev);
        copia.delete(kilate.id);
        return copia;
        });
    }
    };

  if (kilates.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          No hay kilates que coincidan con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card text-card-foreground overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b text-xs uppercase tracking-wider"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                <th className="px-4 py-3 text-center font-medium w-20">Kilate</th>
                <th className="px-4 py-3 text-center font-medium">
                  Precio / gramo
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Ultima actualización
                </th>
                <th className="px-4 py-3 text-left font-medium w-32">Estado</th>
                <th className="px-4 py-3 text-right font-medium w-40">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {kilates.map((kilate) => {
                const isToggling = togglingIds.has(kilate.id);
                return (
                  <tr
                    key={kilate.id}
                    className="border-b last:border-b-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-center">
                      {kilate.kilate}k
                    </td>
                    <td className="px-4 py-3 text-sm  text-center"
                        style={{ color: "var(--color-muted-foreground)" }}  >
                      Bs {kilate.precioGramo.toFixed(2)}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-left"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {formatearFechaHoraBolivia(kilate.fechaActualizacion)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={kilate.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar completo: solo Admin */}
                        {esAdmin && (
                          <button
                            type="button"
                            onClick={() => onEditarCompleto(kilate)}
                            disabled={isToggling}
                            className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                            title="Editar kilate"
                            aria-label={`Editar kilate ${kilate.kilate}k`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}

                        {/* Actualizar precio: Admin y Jefa */}
                        <button
                          type="button"
                          onClick={() => onActualizarPrecio(kilate)}
                          disabled={isToggling}
                          className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                          title="Actualizar precio"
                          aria-label={`Actualizar precio kilate ${kilate.kilate}k`}
                          style={{ color: "var(--color-header-accent)" }}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>

                        {/* Toggle estado: solo Admin */}
                        {esAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleEstado(kilate)}
                            disabled={isToggling}
                            className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                            title={kilate.estado ? "Desactivar" : "Reactivar"}
                            aria-label={
                              kilate.estado
                                ? `Desactivar kilate ${kilate.kilate}k`
                                : `Reactivar kilate ${kilate.kilate}k`
                            }
                            style={{ color: kilate.estado ? "#dc2626" : "#16a34a" }}
                          >
                            {isToggling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CatalogoEnUsoModal
        open={!!bloqueo}
        onOpenChange={(o) => { if (!o) setBloqueo(null); }}
        nombreItem={bloqueo ? `${bloqueo.kilate.kilate}k` : ""}
        registrosAsociados={bloqueo?.registrosAsociados ?? 0}
        contexto="kilate"
      />
    </>
  );
}