// Tabla principal de usuarios con acciones funcionales por fila.
// Botones: editar (navega), gestionar cargos (modal), reset (modal),
// activar/desactivar (toggle inmediato).
"use client";
import Link from "next/link";
import { useState } from "react";
import {
  KeyRound,
  Loader2,
  Pencil,
  Power,
  Shield,
} from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { useAuth } from "@/lib/auth/use-auth";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { CargosCell } from "@/components/admin/cargos-cell";
import { GestionarCargosModal } from "@/components/admin/gestionar-cargos-modal";
import { ResetPasswordModal } from "@/components/admin/reset-password-modal";
import { formatearFechaBolivia } from "@/lib/utils/fecha-bolivia";
import type { UsuarioListItem } from "@/lib/api/types/usuario.types";

interface UsuariosTableProps {
  usuarios: UsuarioListItem[];
  onUsuarioActualizado: (usuario: UsuarioListItem) => void;
}

export function UsuariosTable({
  usuarios,
  onUsuarioActualizado,
}: UsuariosTableProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // Estado de los modales: guardamos el usuario seleccionado para cada modal.
  // Si es null, el modal esta cerrado.
  const [usuarioCargos, setUsuarioCargos] = useState<UsuarioListItem | null>(
    null,
  );
  const [usuarioReset, setUsuarioReset] = useState<UsuarioListItem | null>(
    null,
  );

  const toggleEstado = async (usuario: UsuarioListItem) => {
    if (user?.id === usuario.idCuenta) {
      showToast(
        "No puedes desactivar tu propia cuenta de administrador.",
        "error",
      );
      return;
    }

    setTogglingIds((prev) => new Set(prev).add(usuario.idCuenta));

    try {
      const actualizado = await apiRequest<UsuarioListItem>(
        ENDPOINTS.admin.usuario(usuario.idCuenta),
        { method: "PUT", body: { estado: !usuario.estado } },
      );
      onUsuarioActualizado(actualizado);
      showToast(
        actualizado.estado
          ? `Usuario ${actualizado.userName} activado.`
          : `Usuario ${actualizado.userName} desactivado.`,
        "success",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          err.messages[0] ?? "No se pudo cambiar el estado.",
          "error",
        );
      } else {
        showToast("Error de red al cambiar el estado.", "error");
      }
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(usuario.idCuenta);
        return next;
      });
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-card-foreground">
        <p className="text-sm text-muted-foreground">
          No se encontraron usuarios con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-card text-card-foreground">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-left"
              style={{ backgroundColor: "var(--color-muted)" }}
            >
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">CI</th>
              <th className="px-4 py-3 font-semibold">Cargos</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                Alta
              </th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const enProceso = togglingIds.has(u.idCuenta);
              const esElMismoAdmin = user?.id === u.idCuenta;

              return (
                <tr
                  key={u.idCuenta}
                  className="border-b transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 text-sm font-medium">{u.userName}</td>
                  <td className="px-4 py-3">{u.nombreCompleto}</td>
                  <td className="px-4 py-3 text-sm"
                      style={{ color: "var(--color-muted-foreground)" }}>{u.ci}</td>
                  <td className="px-4 py-3">
                    <CargosCell cargos={u.cargosActivos} />
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={u.estado} />
                  </td>
                  <td className="px-4 py-3 text-sm"
                      style={{ color: "var(--color-muted-foreground)" }}>
                    {formatearFechaBolivia(u.fechaAlta)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Editar: navega a la pagina de edicion */}
                      <Link
                        href={`/admin/usuarios/${u.idCuenta}/editar`}
                        aria-label={`Editar ${u.userName}`}
                        title="Editar datos"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Link>

                      {/* Gestionar cargos: abre modal */}
                      <button
                        type="button"
                        onClick={() => setUsuarioCargos(u)}
                        aria-label={`Gestionar cargos de ${u.userName}`}
                        title="Gestionar cargos"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
                      >
                        <Shield className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {/* Reset password: abre modal */}
                      <button
                        type="button"
                        onClick={() => setUsuarioReset(u)}
                        aria-label={`Resetear contraseña de ${u.userName}`}
                        title="Resetear contraseña"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
                      >
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {/* Toggle estado */}
                      <button
                        type="button"
                        onClick={() => void toggleEstado(u)}
                        disabled={enProceso || esElMismoAdmin}
                        aria-label={
                          u.estado
                            ? `Desactivar ${u.userName}`
                            : `Activar ${u.userName}`
                        }
                        title={
                          esElMismoAdmin
                            ? "No puedes desactivar tu propia cuenta"
                            : u.estado
                              ? "Desactivar"
                              : "Activar"
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ color: u.estado ? "#dc2626" : "#16a34a" }}
                      >
                        {enProceso ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" aria-hidden="true" />
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

      {/* Modales envueltos en ClientOnly para evitar el hydration mismatch
          de Radix UI con React 19.2 + Next.js 15.5+. Los modales generan
          IDs con useId que cambian entre SSR y cliente, por eso los
          montamos solo despues de hidratar. */}
        <GestionarCargosModal
          open={usuarioCargos !== null}
          onOpenChange={(open) => {
            if (!open) setUsuarioCargos(null);
          }}
          usuario={usuarioCargos}
          onUsuarioActualizado={(u) => {
            onUsuarioActualizado(u);
            setUsuarioCargos(u);
          }}
        />

        <ResetPasswordModal
          open={usuarioReset !== null}
          onOpenChange={(open) => {
            if (!open) setUsuarioReset(null);
          }}
          usuario={usuarioReset}
        />
    </>
  );
}