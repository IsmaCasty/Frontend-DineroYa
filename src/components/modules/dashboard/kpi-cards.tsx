'use client';

import type { KpisDto } from '@/lib/api/types/reporte.types';
import {
  FileText, AlertTriangle, CheckCircle2,
  TrendingUp, Gem, Coins,
  Calendar, Bell, AlertCircle,
  Users, UserPlus, Package,
} from 'lucide-react';

function fBob(n: number | undefined | null): string {
  return `Bs. ${(n ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accentColor: string;  // clase border-t-* de Tailwind o hex
  valueColor?: string;
}

function KpiCard({ label, value, sub, icon, accentColor, valueColor }: KpiCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 flex flex-col gap-1.5 border-t-4 ${accentColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`text-2xl font-bold leading-tight ${valueColor ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: KpisDto }) {
  return (
  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
    <KpiCard label="Contratos vigentes"    value={kpis.contratosVigentes}        icon={<FileText size={18} />}    accentColor="border-t-green-500"    valueColor={kpis.contratosVigentes > 0 ? 'text-green-600 dark:text-green-400' : undefined} sub="En curso actualmente" />
    <KpiCard label="Contratos vencidos"    value={kpis.contratosVencidos}         icon={<AlertTriangle size={18} />} accentColor="border-t-red-500"    valueColor={kpis.contratosVencidos > 0 ? 'text-red-600 dark:text-red-400' : undefined}   sub="Requieren atención" />
    <KpiCard label="Cancelados hoy"        value={kpis.contratosCanceladosHoy}    icon={<CheckCircle2 size={18} />}  accentColor="border-t-blue-400"   sub="Finalizados en el día" />
    <KpiCard label="Joyas en custodia"     value={kpis.joyasEnCustodia}           icon={<Package size={18} />}       accentColor="border-t-purple-500" sub="Sin fecha de devolución" />

    <KpiCard label="Cartera total"         value={fBob(kpis.totalCarteraBob)}     icon={<TrendingUp size={18} />}    accentColor="border-t-[#c9a227]"  sub="Saldo capital vigente" />
    <KpiCard label="Cobros hoy"            value={kpis.cobrosHoy}                 icon={<Coins size={18} />}         accentColor="border-t-emerald-500" sub={`${fBob(kpis.montoCobradoHoy)} recaudado`} />
    <KpiCard label="Cobrado este mes"      value={fBob(kpis.cobradoEsteMes)}      icon={<Calendar size={18} />}      accentColor="border-t-sky-400"    sub="Acumulado del mes" />
    <KpiCard label="Monto cobrado hoy"     value={fBob(kpis.montoCobradoHoy)}     icon={<Gem size={18} />}           accentColor="border-t-[#c9a227]"  sub="En bolivianos" />

    <KpiCard label="Alertas pendientes"    value={kpis.alertasPendientes}         icon={<Bell size={18} />}          accentColor="border-t-amber-400"  valueColor={kpis.alertasPendientes > 0 ? 'text-amber-600 dark:text-amber-400' : undefined} sub="Sin atender" />
    <KpiCard label="Alertas críticas"      value={kpis.alertasCriticas}           icon={<AlertCircle size={18} />}   accentColor="border-t-red-600"    valueColor={kpis.alertasCriticas > 0 ? 'text-red-600 dark:text-red-400' : undefined}    sub="Vencidas o vencen hoy" />
    <KpiCard label="Clientes activos"      value={kpis.clientesActivos}           icon={<Users size={18} />}         accentColor="border-t-[#1a3a1a]"  sub="Con contratos vigentes" />
    <KpiCard label="Clientes nuevos"       value={kpis.clientesNuevosEsteMes}     icon={<UserPlus size={18} />}      accentColor="border-t-teal-400"   sub="Registrados este mes" />
  </div>
);
}