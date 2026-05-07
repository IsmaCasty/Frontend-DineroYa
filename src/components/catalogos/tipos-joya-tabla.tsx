// Tabla del catalogo de tipos de joya. Cada fila tiene dos acciones:editar (abre el modal en modo edicion via onEditar)
// y toggle estado (DELETE soft-delete o PUT reactivar segun el estado actual).
// El manejo del 409 CATALOGO_EN_USO usa el type guard esErrorCatalogoEnUso para extraer registrosAsociados del body y mostrar el modal especifico.
"use client";
import { useState } from "react";
import { Loader2, Pencil, Power } from "lucide-react";
import {
  apiRequest,
  ApiError,
  esErrorCatalogoEnUso,
} from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { CatalogoEnUsoModal } from "@/components/catalogos/catalogo-en-uso-modal";
import type { TipoJoya } from "@/lib/api/types/catalogo.types";

interface TiposJoyaTablaProps {
  tipos: TipoJoya[];
  onEditar: (tipo: TipoJoya) => void;
  onActualizado: (tipo: TipoJoya) => void;
}

export function TiposJoyaTabla({
  tipos,
  onEditar,
  onActualizado,
}: TiposJoyaTablaProps) {
  const { showToast } = useToast();

    // Set de ids con toggle en curso. Se usa para mostrar spinner por fila
    // sin bloquear toda la tabla.
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    // Estado del modal de catalogo-en-uso. Si es null, modal cerrado.
    // Si tiene valor, modal abierto con los datos del intento bloqueado.
    const [bloqueo, setBloqueo] = useState<{
        tipo: TipoJoya;
        registrosAsociados: number;
    } | null>(null);

    const toggleEstado = async (tipo: TipoJoya) => {
    setTogglingIds((prev) => new Set(prev).add(tipo.id));
    try {
        if (tipo.estado) {
        await apiRequest<unknown>(
            ENDPOINTS.catalogos.tipoJoya(tipo.id),
            { method: "DELETE" },
        );
        } else {
        await apiRequest<unknown>(
            ENDPOINTS.catalogos.tipoJoyaReactivar(tipo.id),
            { method: "PUT" },
        );
        }
        // Siempre buscamos el objeto completo despues de la mutacion.
        // Esto garantiza que upsertLocal recibe un TipoJoya valido sin
        // depender del shape del response de DELETE ni de PUT reactivar.
        const actualizado = await apiRequest<TipoJoya>(
        ENDPOINTS.catalogos.tipoJoya(tipo.id),
        );
        showToast(
        `"${tipo.descripcion}" ${tipo.estado ? "desactivado" : "reactivado"} correctamente.`,
        "success",
        );
        onActualizado(actualizado);
    } catch (err) {
        if (esErrorCatalogoEnUso(err)) {
        setBloqueo({
            tipo,
            registrosAsociados: (err.raw as { registrosAsociados?: number }).registrosAsociados ?? 0,
        });
        } else if (err instanceof ApiError) {
        showToast(err.messages[0] ?? "No se pudo cambiar el estado.", "error");
        } else {
        showToast("Error de red al cambiar el estado.", "error");
        }
    } finally {
        setTogglingIds((prev) => {
        const copia = new Set(prev);
        copia.delete(tipo.id);
        return copia;
        });
    }
    };

    if (tipos.length === 0) {
        return (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
            <p className="text-sm text-muted-foreground">
            No hay tipos de joya que coincidan con los filtros aplicados.
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
                <th className="px-4 py-3 text-center font-medium w-20">
                  ID
                </th>
                <th className="px-4 py-3 text-center font-medium w-[50%]">
                  Tipo de Joya
                </th>
                <th className="px-4 py-3 text-center font-medium w-32">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-medium w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => {
                const isToggling = togglingIds.has(tipo.id);
                return (
                  <tr
                    key={tipo.id}
                    className="border-b last:border-b-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-sm font-mono">
                      {tipo.id}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {tipo.descripcion}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EstadoBadge activo={tipo.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditar(tipo)}
                          disabled={isToggling}
                          className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                          title="Editar"
                          aria-label={`Editar ${tipo.descripcion}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleEstado(tipo)}
                          disabled={isToggling}
                          className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                          title={tipo.estado ? "Desactivar" : "Reactivar"}
                          aria-label={
                            tipo.estado
                              ? `Desactivar ${tipo.descripcion}`
                              : `Reactivar ${tipo.descripcion}`
                          }
                          style={{
                            color: tipo.estado ? "#dc2626" : "#16a34a",
                          }}
                        >
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
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
        onOpenChange={(o) => {
          if (!o) setBloqueo(null);
        }}
        nombreItem={bloqueo?.tipo.descripcion ?? ""}
        registrosAsociados={bloqueo?.registrosAsociados ?? 0}
        contexto="tipo de joya"
      />
    </>
  );
}