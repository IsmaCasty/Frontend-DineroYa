// Detalle del cliente con historial. Consume GET /clientes/:id/historial que devuelve el cliente completo mas los arrays de:
// prestamos, pagos y devoluciones. Las secciones de historial muestran placeholders informativos por ahora.
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/use-auth";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { ROLES } from "@/lib/sidebar/sidebar-items";
import {
  formatearFechaBolivia,
  formatearFechaHoraBolivia,
} from "@/lib/utils/fecha-bolivia";
import type { HistorialCliente } from "@/lib/api/types/cliente.types";

export default function DetalleClientePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const id = Number(params.id);
  const esAdminOJefa =
    user?.cargoActivo?.nombre === ROLES.ADMINISTRADOR ||
    user?.cargoActivo?.nombre === ROLES.JEFA;

  const [historial, setHistorial] = useState<HistorialCliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiRequest<HistorialCliente>(
          ENDPOINTS.clientes.historial(id),
        );
        setHistorial(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.messages[0] ?? "No se pudo cargar el cliente.");
        } else {
          setError("Error de red al cargar el cliente.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    void cargar();
  }, [id]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Cargando datos del cliente...
        </p>
      </div>
    );
  }

  if (error || !historial) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
        <p className="text-sm" style={{ color: "#dc2626" }}>
          {error ?? "Cliente no encontrado."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/clientes")}
          className="mt-3 text-sm underline"
          style={{ color: "var(--color-header-accent)" }}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const { cliente, prestamos, pagos, devoluciones, resumen } = historial;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header con navegacion y boton de editar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/clientes")}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {cliente.nombreCompleto}
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              CI: {cliente.ci} - RESGISTRADO el{" "}
              {formatearFechaBolivia(cliente.fechaCreacion)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EstadoBadge activo={cliente.estado} />
          {esAdminOJefa && (
            <button
              type="button"
              onClick={() => router.push(`/admin/clientes/${cliente.id}/editar`)}
              className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium"
            style={{
                backgroundColor: "var(--color-header-accent)",
            }}
            >
              <Pencil className="h-4 w-4" />
              Editar Cliente
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen del historial */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaResumen
          titulo="Prestamos Totales"
          valor={resumen.totalPrestamos}
        />
        <TarjetaResumen
          titulo="Pagos Realizados"
          valor={resumen.totalPagos}
        />
        <TarjetaResumen
          titulo="Joyas Devueltas"
          valor={resumen.totalDevoluciones}
        />
      </div>

      {/* Datos del cliente */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identificacion */}
        <section className="rounded-lg border bg-card p-6 text-card-foreground space-y-3">
          <h2 className="text-base font-semibold">Identificación:</h2>
          <FilaDato label="Tipo de Documento:" valor={cliente.tipoDocumento} />
          <FilaDato label="CI / Documento:" valor={cliente.ci} />
          <FilaDato label="NIT:" valor={cliente.nit} />
        </section>

        {/* Datos personales */}
        <section className="rounded-lg border bg-card p-6 text-card-foreground space-y-3">
          <h2 className="text-base font-semibold">Datos Personales:</h2>
          <FilaDato label="Nombre completo:" valor={cliente.nombreCompleto} />
          <FilaDato
            label="Género:"
            valor={
              cliente.genero === "M"
                ? "MASCULINO"
                : cliente.genero === "F"
                ? "FEMENINO"
                : null
            }
          />
          <FilaDato
            label="Fecha de Nacimiento:"
            valor={formatearFechaBolivia(cliente.fechaNacimiento)}
          />
          <FilaDato label="Nacionalidad:" valor={cliente.nacionalidad} />
        </section>

        {/* Contacto */}
        <section className="rounded-lg border bg-card p-6 text-card-foreground space-y-3">
          <h2 className="text-base font-semibold">Contacto:</h2>
          <FilaDato label="Teléfono:" valor={cliente.telefono} />
          <FilaDato label="Dirección:" valor={cliente.direccion} />
          <FilaDato
            label="Zona:"
            valor={
              cliente.zonaNombre
                ? `${cliente.localidadNombre} - ${cliente.zonaNombre}`
                : null
            }
          />
        </section>

        {/* Auditoria */}
        <section className="rounded-lg border bg-card p-6 text-card-foreground space-y-3">
          <h2 className="text-base font-semibold">Registro del Sistema:</h2>
          <FilaDato
            label="Fecha de Creación del Cliente:"
            valor={formatearFechaHoraBolivia(cliente.fechaCreacion)}
          />
          <FilaDato
            label="Última Actualización:"
            valor={formatearFechaHoraBolivia(cliente.fechaActualizacion)}
          />
          <FilaDato label="Estado:" valor={cliente.estado ? "Activo" : "Inactivo"} />
        </section>
      </div>

      {/* Historial de prestamos: placeholder Sprint 3 */}
      <SeccionHistorial
        titulo="Prestamos y Contratos:"
        cantidad={prestamos.length}
      />

      {/* Historial de pagos: placeholder Sprint 4 */}
      <SeccionHistorial
        titulo="Pagos y Cobros:"
        cantidad={pagos.length}
      />

      {/* Historial de devoluciones: placeholder Sprint 4 */}
      <SeccionHistorial
        titulo="Devoluciones de Joyas:"
        cantidad={devoluciones.length}
      />
    </div>
  );
}

interface FilaDatoProps {
  label: string;
  valor: string | null | undefined;
}

function FilaDato({ label, valor }: FilaDatoProps) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span style={{ color: "var(--color-muted-foreground)" }}>{label}</span>
      <span className="text-right font-medium">
        {valor ?? (
          <span style={{ color: "var(--color-muted-foreground)" }}>
            Sin datos
          </span>
        )}
      </span>
    </div>
  );
}

interface TarjetaResumenProps {
  titulo: string;
  valor: number;
}

function TarjetaResumen({ titulo, valor }: TarjetaResumenProps) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <p
        className="text-sm"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {titulo}:
      </p>
      <p className="text-3xl font-bold mt-1">{valor}</p>
    </div>
  );
}

interface SeccionHistorialProps {
  titulo: string;
  cantidad: number;
}

function SeccionHistorial({ titulo, cantidad }: SeccionHistorialProps) {
  return (
    <section className="rounded-lg border bg-card p-6 text-card-foreground">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">{titulo}</h2>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor: "var(--color-background-secondary)",
            color: "var(--color-muted-foreground)",
          }}
        >
        </span>
      </div>
      {cantidad === 0 ? (
        <p
          className="text-sm"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Por ahora no hay registros asociados a este cliente.
        </p>
      ) : (
        <p className="text-sm">
          {cantidad} registro {cantidad !== 1 ? "s" : ""} asociado {cantidad !== 1 ? "s" : ""} a este cliente.
        </p>
      )}
    </section>
  );
}