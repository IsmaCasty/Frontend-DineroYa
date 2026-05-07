// Tabla del listado de clientes. Acciones por fila:
// - Ver detalle: navega a /admin/clientes/[id] (todos los roles).
// - Editar: navega a /admin/clientes/[id]/editar (Admin y Jefa).
// - Toggle estado: desactivar/reactivar (solo Admin).
// El boton de editar y el de toggle se muestran u ocultan segun el rol
// activo del usuario que viene de useAuth().
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Pencil, Power } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { useAuth } from "@/lib/auth/use-auth";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { ROLES } from "@/lib/sidebar/sidebar-items";
import { formatearFechaBolivia } from "@/lib/utils/fecha-bolivia";
import type { ClienteListItem } from "@/lib/api/types/cliente.types";

interface ClientesTablaProps {
  clientes: ClienteListItem[];
  onActualizado: (cliente: ClienteListItem) => void;
}

export function ClientesTabla({ clientes, onActualizado }: ClientesTablaProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();

  const esAdmin = user?.cargoActivo?.nombre === ROLES.ADMINISTRADOR;
  const esAdminOJefa =
    esAdmin || user?.cargoActivo?.nombre === ROLES.JEFA;

  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const toggleEstado = async (cliente: ClienteListItem) => {
    setTogglingIds((prev) => new Set(prev).add(cliente.id));
    try {
      if (cliente.estado) {
        // Soft-delete: Admin desactiva.
        await apiRequest<unknown>(
          ENDPOINTS.clientes.porId(cliente.id),
          { method: "DELETE" },
        );
      } else {
        // Reactivar.
        await apiRequest<unknown>(
          ENDPOINTS.clientes.reactivar(cliente.id),
          { method: "PUT" },
        );
      }
      // GET del objeto completo post-mutacion. Mismo patron que catalogos.
      const actualizado = await apiRequest<ClienteListItem>(
        ENDPOINTS.clientes.porId(cliente.id),
      );
      showToast(
        `Cliente ${cliente.nombreCompleto} ${cliente.estado ? "desactivado" : "reactivado"} correctamente.`,
        "success",
      );
      onActualizado(actualizado);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.messages[0] ?? "No se pudo cambiar el estado.", "error");
      } else {
        showToast("Error de red al cambiar el estado.", "error");
      }
    } finally {
      setTogglingIds((prev) => {
        const copia = new Set(prev);
        copia.delete(cliente.id);
        return copia;
      });
    }
  };

  if (clientes.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          No se encontraron clientes con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b text-xs uppercase tracking-wider"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              <th className="px-4 py-3 text-left font-medium">Nombre Cliente</th>
              <th className="px-4 py-3 text-left font-medium w-32">CI</th>
              <th className="px-4 py-3 text-left font-medium">Zona</th>
              <th className="px-4 py-3 text-left font-medium">Telefono</th>
              <th className="px-4 py-3 text-left font-medium w-28">Registro</th>
              <th className="px-4 py-3 text-left font-medium w-28">Estado</th>
              <th className="px-4 py-3 text-right font-medium w-36">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              const isToggling = togglingIds.has(cliente.id);
              return (
                <tr
                  key={cliente.id}
                  className="border-b last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {cliente.nombreCompleto}
                  </td>
                  <td className="px-4 py-3 text-sm"
                    style={{ color: "var(--color-muted-foreground)" }}>
                    {cliente.ci}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {cliente.zonaNombre
                      ? `${cliente.localidadNombre} - ${cliente.zonaNombre}`
                      : "Sin zona"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {cliente.telefono ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {formatearFechaBolivia(cliente.fechaCreacion)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={cliente.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ver detalle: todos los roles */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/clientes/${cliente.id}`)
                        }
                        className="p-2 rounded-md hover:bg-secondary transition-colors"
                        title="Ver detalle"
                        aria-label={`Ver detalle de ${cliente.nombreCompleto}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Editar: Admin y Jefa */}
                      {esAdminOJefa && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/clientes/${cliente.id}/editar`)
                          }
                          disabled={isToggling}
                          className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                          title="Editar"
                          aria-label={`Editar ${cliente.nombreCompleto}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {/* Toggle estado: solo Admin */}
                      {esAdmin && (
                        <button
                          type="button"
                          onClick={() => toggleEstado(cliente)}
                          disabled={isToggling}
                          className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                          title={cliente.estado ? "Desactivar" : "Reactivar"}
                          aria-label={
                            cliente.estado
                              ? `Desactivar ${cliente.nombreCompleto}`
                              : `Reactivar ${cliente.nombreCompleto}`
                          }
                          style={{
                            color: cliente.estado ? "#dc2626" : "#16a34a",
                          }}
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
  );
}