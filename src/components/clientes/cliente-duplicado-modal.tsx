// Modal que aparece cuando el backend devuelve 409 CLIENTE_DUPLICADO.
// Muestra los datos clave del cliente existente y ofrece dos acciones:
// 1. Ver cliente existente: navega a su pagina de detalle.
// 2. Cancelar y corregir CI: cierra el modal y el usuario puede editar el CI.
// No permite continuar con el alta duplicada.
"use client";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatearFechaBolivia } from "@/lib/utils/fecha-bolivia";
import type { ClienteDetalle } from "@/lib/api/types/cliente.types";

interface ClienteDuplicadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // El objeto clienteExistente viene del body del 409 del backend.
  clienteExistente: ClienteDetalle | null;
}

export function ClienteDuplicadoModal({
  open,
  onOpenChange,
  clienteExistente,
}: ClienteDuplicadoModalProps) {
  const router = useRouter();

  if (!open || !clienteExistente) return null;

  const handleVerCliente = () => {
    onOpenChange(false);
    router.push(`/admin/clientes/${clienteExistente.id}`);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Cliente ya registrado"
      size="sm"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="h-6 w-6 shrink-0 mt-0.5"
            style={{ color: "#ea580c" }}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm">
              Ya existe un cliente registrado con el CI{" "}
              <strong>{clienteExistente.ci}</strong>.
            </p>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              No se pueden registrar dos clientes con el mismo documento.
            </p>
          </div>
        </div>

        {/* Datos del cliente existente para que el cajero pueda verificar */}
        <div
          className="rounded-md p-3 space-y-1 text-sm"
          style={{
            backgroundColor: "var(--color-background-secondary)",
            borderLeft: "3px solid var(--color-header-accent)",
          }}
        >
          <p>
            <span style={{ color: "var(--color-muted-foreground)" }}>
              Nombre:{" "}
            </span>
            <strong>{clienteExistente.nombreCompleto}</strong>
          </p>
          <p>
            <span style={{ color: "var(--color-muted-foreground)" }}>CI: </span>
            {clienteExistente.ci}
          </p>
          {clienteExistente.telefono && (
            <p>
              <span style={{ color: "var(--color-muted-foreground)" }}>
                Telefono:{" "}
              </span>
              {clienteExistente.telefono}
            </p>
          )}
          <p>
            <span style={{ color: "var(--color-muted-foreground)" }}>
              Registrado:{" "}
            </span>
            {formatearFechaBolivia(clienteExistente.fechaCreacion)}
          </p>
          <p>
            <span style={{ color: "var(--color-muted-foreground)" }}>
              Estado:{" "}
            </span>
            {clienteExistente.estado ? "Activo" : "Inactivo"}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
            style={{ borderColor: "var(--color-border)" }}
          >
            Cancelar y corregir CI
          </button>
          <button
            type="button"
            onClick={handleVerCliente}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-header-bg)",
              color: "white",
            }}
          >
            Ver cliente existente
          </button>
        </div>
      </div>
    </Modal>
  );
}