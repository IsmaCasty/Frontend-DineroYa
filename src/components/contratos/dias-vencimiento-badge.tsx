// Indicador de dias hasta el vencimiento del contrato.
// Verde si quedan mas de 7 dias, amarillo si quedan 1-7, rojo si ya vencio.
// Los dias negativos indican mora (el contrato paso su fecha de pago).
import { Calendar, AlertTriangle } from "lucide-react";

interface DiasVencimientoBadgeProps {
  dias: number;
  // Estado del contrato: solo mostramos el indicador si esta VIGENTE
  estado: string;
}

export function DiasVencimientoBadge({
  dias,
  estado,
}: DiasVencimientoBadgeProps) {
  // Para contratos no vigentes mostramos un guion simple
  if (estado !== "VIGENTE") {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  // Contrato vencido: dias negativo = mora
  if (dias < 0) {
    const diasMora = Math.abs(dias);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />
        {diasMora}d mora
      </span>
    );
  }

  // Vence hoy
  if (dias === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Hoy
      </span>
    );
  }

  // Vence en 1-7 dias: alerta amarilla
  if (dias <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Calendar className="h-3 w-3" />
        {dias}d
      </span>
    );
  }

  // Mas de 7 dias: todo bien, verde
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <Calendar className="h-3 w-3" />
      {dias}d
    </span>
  );
}