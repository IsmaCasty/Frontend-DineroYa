// Panel de resultados del calculo de prestamo (RF-22).
// Componente de solo lectura: recibe el response de POST /contratos/calcular y lo muestra de forma clara antes de confirmar la operacion.
// Desglosa el interes en sus dos componentes separados (legal 3% y gastos admin) tal como aparece en el recibo fisico de la empresa.

import { CheckCircle } from "lucide-react";
import { formatearFechaBolivia } from "@/lib/utils/fecha-bolivia";
import type { CalculoPrestamoResponse } from "@/lib/api/types/contrato.types";

interface PanelCalculoPreviewProps {
  calculo: CalculoPrestamoResponse;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function PanelCalculoPreview({ calculo }: PanelCalculoPreviewProps) {
  const esUSD = calculo.monedaCodigo === "USD";

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      {/* Titulo del panel */}
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-semibold text-foreground">
          Vista previa del Cálculo del Contrato:
        </h4>
      </div>

      {/* Tabla de joyas valoradas */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: "#1a3a1a", color: "white" }}>
              <th className="px-3 py-2 text-left font-semibold">Tipo</th>
              <th className="px-3 py-2 text-center font-semibold">Kilate</th>
              <th className="px-3 py-2 text-right font-semibold">P. Bruto</th>
              <th className="px-3 py-2 text-right font-semibold">P. Neto</th>
              <th className="px-3 py-2 text-right font-semibold">
                Precio/g
              </th>
              <th className="px-3 py-2 text-right font-semibold">Préstamo</th>
              <th className="px-3 py-2 text-right font-semibold">Tasación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {calculo.joyas.map((joya) => (
              <tr key={joya.secJoya} className="bg-card">
                <td className="px-3 py-2 text-foreground">
                  {joya.tipoJoyaDescripcion}
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">
                  {joya.kilateValor}k
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {fmt(joya.pesoBruto)}g
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {fmt(joya.pesoNeto)}g
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {fmt(joya.precioGramo)}
                </td>
                <td className="px-3 py-2 text-right font-medium text-foreground">
                  {fmt(joya.valorPrestamo)} BOB
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {fmt(joya.valorTasacion)} BOB
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen de montos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Maximo Prestable</p>
          <p className="font-semibold text-foreground">
            {fmt(calculo.montoMaximoPrestable)} BOB
          </p>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Monto Solicitado</p>
          <p className="font-semibold text-foreground">
            {fmt(calculo.montoSolicitado)} {calculo.monedaCodigo}
            {esUSD && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({fmt(calculo.montoSolicitadoBOB)} BOB)
              </span>
            )}
          </p>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Linea disponible</p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {fmt(calculo.lineaDisponible)} BOB
          </p>
        </div>
      </div>

      {/* Desglose del interes mensual: los dos componentes por separado */}
      <div className="rounded-md border border-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Desglose de interes mensual ({calculo.tramo.tasaTotal}% total)
        </p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Interes legal ({calculo.tramo.tasaInteres}%)
            </span>
            <span className="font-medium text-foreground">
              {fmt(calculo.montoInteresPorPlazo)} BOB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Gastos admin / custodia ({calculo.tramo.tasaGastosAdmin}%)
            </span>
            <span className="font-medium text-foreground">
              {fmt(calculo.montoGastosAdminPorPlazo)} BOB
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="font-semibold text-foreground">
              TOTAL A PAGAR EN FECHA DE VENCIMIENTO:
            </span>
            <span
              className="text-base font-bold"
              style={{ color: "#c9a227" }}
            >
              {fmt(calculo.montoTotalInteresPorPlazo)} BOB
              {esUSD && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({fmt(calculo.montoTotalInteresPorPlazo / calculo.tasaCambio)}{" "}
                  USD)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Fechas del contrato */}
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
          <span className="text-muted-foreground">Desembolso</span>
          <span className="font-medium text-foreground">
            {formatearFechaBolivia(calculo.fechaDesembolso)}
          </span>
        </div>
        <div className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
          <span className="text-muted-foreground">Vencimiento</span>
          <span className="font-medium text-foreground">
            {formatearFechaBolivia(calculo.fechaVencimiento)}
          </span>
        </div>
      </div>

      {/* Tipo de cambio si es USD */}
      {esUSD && (
        <p className="text-xs text-muted-foreground">
          Tipo de cambio del dia: 1 USD = {fmt(calculo.tasaCambio)} BOB
        </p>
      )}
    </div>
  );
}