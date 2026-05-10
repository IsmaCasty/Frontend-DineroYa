// Tabla del listado de contratos.
// Header con fondo verde oscuro (#1a3a1a) y texto blanco: hardcodeado
// porque es identidad de marca (las variables CSS no resuelven bien
// en backgrounds de elementos con posicion relativa como thead).
// Cada fila navega al detalle del contrato al hacer click en el icono.
"use client";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { ContratoEstadoBadge } from "@/components/contratos/contrato-estado-badge";
import { DiasVencimientoBadge } from "@/components/contratos/dias-vencimiento-badge";
import { formatearFechaBolivia } from "@/lib/utils/fecha-bolivia";
import type { ContratoListadoItem } from "@/lib/api/types/contrato.types";

interface ContratosTablaProps {
  contratos: ContratoListadoItem[];
  isLoading: boolean;
}

// Formatea un monto con separador de miles y 2 decimales segun convencion boliviana
function formatMonto(monto: number, moneda: string): string {
  const formatted = new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
  return `${formatted} ${moneda}`;
}

export function ContratosTabla({ contratos, isLoading }: ContratosTablaProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Cargando contratos...
        </span>
      </div>
    );
  }

  if (contratos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-20 text-center">
        <p className="text-sm text-muted-foreground">
          No se encontraron contratos con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              // Color de marca hardcodeado: identidad visual del sistema
              style={{ backgroundColor: "#1a3a1a", color: "white" }}
            >
              <th className="px-4 py-3 text-left font-semibold">N° Contrato</th>
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Cajero</th>
              <th className="px-4 py-3 text-left font-semibold">Desembolso</th>
              <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
              <th className="px-4 py-3 text-right font-semibold">Capital</th>
              <th className="px-4 py-3 text-right font-semibold">Saldo</th>
              <th className="px-4 py-3 text-center font-semibold">Joyas</th>
              <th className="px-4 py-3 text-center font-semibold">Estado</th>
              <th className="px-4 py-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contratos.map((contrato) => (
              <tr
                key={contrato.id}
                className="bg-card transition-colors hover:bg-muted/50"
              >
                {/* Numero de contrato: fuente mono para que se alinee bien */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {contrato.nroContrato}
                  </span>
                  {contrato.nroFolio && (
                    <p className="text-xs text-muted-foreground">
                      Folio: {contrato.nroFolio}
                    </p>
                  )}
                </td>

                {/* Datos del cliente */}
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {contrato.cliente.nombreCompleto}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CI: {contrato.cliente.ci}
                  </p>
                </td>

                {/* Cajero que creo el contrato */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {contrato.cajero.userName}
                  </span>
                </td>

                {/* Fecha de desembolso en hora Bolivia */}
                <td className="px-4 py-3 text-sm text-foreground">
                {formatearFechaBolivia(contrato.fechaDesembolso)}
                </td>

                {/* Fecha de vencimiento + indicador de dias */}
                <td className="px-4 py-3">
                <p className="mb-1 text-sm text-foreground">
                    {formatearFechaBolivia(contrato.fechaPago)}
                </p>
                <DiasVencimientoBadge
                    dias={contrato.diasHastaVencimiento}
                    estado={contrato.estado}
                />
                </td>

                {/* Monto del prestamo original */}
                <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                  {formatMonto(contrato.montoPrestamo, contrato.moneda)}
                </td>

                {/* Saldo pendiente de capital */}
                <td className="px-4 py-3 text-right font-mono text-sm">
                  <span
                    className={
                      contrato.saldoCapital > 0
                        ? "text-foreground"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {formatMonto(contrato.saldoCapital, contrato.moneda)}
                  </span>
                </td>

                {/* Cantidad de joyas en garantia */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {contrato.cantidadJoyas}
                  </span>
                </td>

                {/* Badge de estado */}
                <td className="px-4 py-3 text-center">
                  <ContratoEstadoBadge estado={contrato.estado} />
                </td>

                {/* Accion: ver detalle */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() =>
                      router.push(`/admin/contratos/${contrato.id}`)
                    }
                    aria-label={`Ver detalle del contrato ${contrato.nroContrato}`}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}