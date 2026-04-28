// Modal para asignar/revocar cargos de un usuario.
// Aplicacion inmediata (sin boton guardar): cada click hace su request.
"use client";
import { useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useCargos } from "@/lib/hooks/use-cargos";
import { useToast } from "@/lib/toast/use-toast";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { UsuarioListItem } from "@/lib/api/types/usuario.types";

interface GestionarCargosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioListItem | null;
  // Callback para que el padre actualice la lista local sin re-fetch.
  onUsuarioActualizado: (usuario: UsuarioListItem) => void;
}

export function GestionarCargosModal({
  open,
  onOpenChange,
  usuario,
  onUsuarioActualizado,
}: GestionarCargosModalProps) {
  const { showToast } = useToast();
  const { cargos, isLoading: cargosLoading } = useCargos();

  // Set de idCargos con accion en curso. Permite mostrar spinner por boton.
  const [enProceso, setEnProceso] = useState<Set<number>>(new Set());

  if (!usuario) return null;

  // IDs de cargos que el usuario ya tiene activos.
  const idsActivos = new Set(usuario.cargosActivos.map((c) => c.id));

  // Cargos disponibles para asignar (los que NO tiene activos).
  const cargosDisponibles = cargos.filter((c) => !idsActivos.has(c.id));

  const marcarEnProceso = (idCargo: number, valor: boolean) => {
    setEnProceso((prev) => {
      const next = new Set(prev);
      if (valor) next.add(idCargo);
      else next.delete(idCargo);
      return next;
    });
  };

  const onAsignar = async (idCargo: number) => {
    marcarEnProceso(idCargo, true);
    try {
      const actualizado = await apiRequest<UsuarioListItem>(
        ENDPOINTS.admin.asignarCargo(usuario.idCuenta),
        { method: "POST", body: { idCargo } },
      );
      onUsuarioActualizado(actualizado);
      const nombreCargo =
        cargos.find((c) => c.id === idCargo)?.nombre ?? "Cargo";
      showToast(`${nombreCargo} asignado a ${usuario.userName}.`, "success");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          err.messages[0] ?? "No se pudo asignar el cargo.",
          "error",
        );
      } else {
        showToast("Error de red al asignar el cargo.", "error");
      }
    } finally {
      marcarEnProceso(idCargo, false);
    }
  };

  const onRevocar = async (idCargo: number) => {
    // Validacion local: no permitir revocar el ultimo cargo.
    if (usuario.cargosActivos.length === 1) {
      showToast(
        "No se puede revocar el unico cargo activo. Asigna otro primero.",
        "error",
      );
      return;
    }

    marcarEnProceso(idCargo, true);
    try {
      const actualizado = await apiRequest<UsuarioListItem>(
        ENDPOINTS.admin.revocarCargo(usuario.idCuenta, idCargo),
        { method: "DELETE" },
      );
      onUsuarioActualizado(actualizado);
      const nombreCargo =
        cargos.find((c) => c.id === idCargo)?.nombre ?? "Cargo";
      showToast(
        `${nombreCargo} revocado de ${usuario.userName}.`,
        "success",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          err.messages[0] ?? "No se pudo revocar el cargo.",
          "error",
        );
      } else {
        showToast("Error de red al revocar el cargo.", "error");
      }
    } finally {
      marcarEnProceso(idCargo, false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Gestionar cargos"
      description={`Cuentas y permisos de ${usuario.nombreCompleto}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Cargos activos del usuario */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">
            Cargos activos
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({usuario.cargosActivos.length})
            </span>
          </h3>

          {usuario.cargosActivos.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              Este usuario no tiene cargos activos.
            </p>
          ) : (
            <ul className="space-y-2">
              {usuario.cargosActivos.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                  style={{ borderColor: "var(--color-input)" }}
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className="h-4 w-4"
                      style={{ color: "var(--color-dy-gold-600)" }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">{c.nombre}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRevocar(c.id)}
                    disabled={
                      enProceso.has(c.id) ||
                      usuario.cargosActivos.length === 1
                    }
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ color: "#dc2626" }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(220, 38, 38, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {enProceso.has(c.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" aria-hidden="true" />
                    )}
                    Revocar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Cargos disponibles para asignar */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">Disponibles</h3>

          {cargosLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : cargosDisponibles.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              Este usuario ya tiene todos los cargos disponibles.
            </p>
          ) : (
            <ul className="space-y-2">
              {cargosDisponibles.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                  style={{ borderColor: "var(--color-input)" }}
                >
                  <div>
                    <p className="text-sm font-medium">{c.nombre}</p>
                    {c.descripcion && (
                      <p className="text-xs text-muted-foreground">
                        {c.descripcion}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void onAsignar(c.id)}
                    disabled={enProceso.has(c.id)}
                    className="inline-flex items-center text-foreground gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-dy-gold-500)",
                    }}
                  >
                    {enProceso.has(c.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    )}
                    Asignar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}