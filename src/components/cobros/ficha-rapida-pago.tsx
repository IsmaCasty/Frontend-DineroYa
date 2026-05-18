// frontend/src/components/cobros/ficha-rapida-pago.tsx
// Ficha compacta lateral para el cajero durante el registro de cobro.
// Muestra en un vistazo todo lo necesario: cliente, contrato, montos clave.
// Sticky en desktop para que no desaparezca al scrollear el formulario.
'use client';
import { Gem, TrendingDown, Calendar } from 'lucide-react';
import type { ContratoParaPago } from '@/lib/api/types/pago.types';

interface Props {
  contrato: ContratoParaPago;
}

function fmt(n: number): string {
  return n.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function obtenerHoyBolivia(): string {
  const offsetBolivia = 4 * 60 * 60 * 1000;
  return new Date(Date.now() - offsetBolivia).toISOString().split('T')[0];
}

function calcularDiasTranscurridos(fechaPagoStr: string, diasPlazo: number): number {
  const venc = new Date(fechaPagoStr + 'T00:00:00Z');
  const inicio = new Date(venc.getTime() - diasPlazo * 24 * 60 * 60 * 1000);
  const hoy = new Date(obtenerHoyBolivia() + 'T00:00:00Z');
  return Math.max(1, Math.floor((hoy.getTime() - inicio.getTime()) / (86400000)));
}

function calcularDiasHastaVenc(fechaPagoStr: string): number {
  const hoy = new Date(obtenerHoyBolivia() + 'T00:00:00Z');
  const venc = new Date(fechaPagoStr + 'T00:00:00Z');
  return Math.floor((venc.getTime() - hoy.getTime()) / 86400000);
}

function fmtFecha(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function redondear(v: number): number {
  return Math.round(v * 100) / 100;
}

function claseDias(dias: number): string {
  if (dias < 0) return 'text-red-600 dark:text-red-400 font-bold';
  if (dias <= 3) return 'text-red-500 dark:text-red-400 font-semibold';
  if (dias <= 7) return 'text-amber-500 dark:text-amber-400 font-semibold';
  return 'text-green-600 dark:text-green-400 font-semibold';
}

export function FichaRapidaPago({ contrato }: Props) {
  const diasTranscurridos = calcularDiasTranscurridos(contrato.fechaPago, contrato.diasPlazo);
  const diasRestantes = calcularDiasHastaVenc(contrato.fechaPago);

  const capital = contrato.saldoCapital;
  const tasaI = contrato.tasaInteres / 100;
  const tasaG = contrato.tasaGastosAdmin / 100;

  // Interés proporcional a los días transcurridos (lo que realmente se cobra hoy)
  const interesHoy = redondear(capital * tasaI * (diasTranscurridos / 30));
  const gastosHoy = redondear(capital * tasaG * (diasTranscurridos / 30));
  const totalHoy = redondear(interesHoy + gastosHoy);

  // Interés estándar 30 días (referencia)
  const interesMensual = redondear(capital * tasaI);
  const gastosMensual = redondear(capital * tasaG);
  const totalMensual = redondear(interesMensual + gastosMensual);

  const moneda = contrato.moneda.codigoIso;

  return (
    <div className="sticky top-4 flex flex-col gap-3 overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Cabecera verde */}
      <div className="px-4 py-3" style={{ backgroundColor: '#1a3a1a' }}>
        <p className="font-mono text-[11px] text-white/60 uppercase tracking-wide">
          {contrato.nroContrato}
        </p>
        <p className="font-mono text-base font-bold text-white leading-tight mt-0.5">
          {contrato.cliente.nombreCompleto}
        </p>
        <p className="text-xs text-white/70 mt-0.5">
          CI: {contrato.cliente.ci}
          {contrato.cliente.telefono && (
            <> | Celular: {contrato.cliente.telefono}</>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {/* Estado y vencimiento */}
        <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Vencimiento
            </p>
            <p className="text-md font-semibold text-foreground">
              {fmtFecha(contrato.fechaPago)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-md ${claseDias(diasRestantes)}`}>
              {diasRestantes >= 0
                ? `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`
                : `Vencido hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) !== 1 ? 's' : ''}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {diasTranscurridos} días transcurridos
            </p>
          </div>
        </div>

        {/* Capital */}
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Gem className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Saldo Capital:
            </p>
          </div>
          <p className="text-xl font-bold tabular-nums" style={{ color: '#c9a227' }}>
            {fmt(capital)} {moneda}
          </p>
          <p className="text-sm text-muted-foreground">
            {contrato.joyas.length} joya{contrato.joyas.length !== 1 ? 's' : ''} en garantía
          </p>
        </div>

        {/* Tasas */}
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tasas ({contrato.tasaInteres + contrato.tasaGastosAdmin}% mensual)
            </p>
          </div>
        </div>

        {/* Referencia mensual estándar */}
        <div className="rounded-md bg-muted/30 p-3">
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Referencia (30 días estándar)
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total a Pagar Mensual:</span>
            <span className="tabular-nums font-medium">
              {fmt(totalMensual)} {moneda}
            </span>
          </div>
        </div>

        {/* Lo que se cobra HOY (proporcional a días transcurridos) */}
        <div
          className="rounded-md border-2 p-3"
          style={{ borderColor: '#1a3a1a' }}
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
            A cobrar hoy ({diasTranscurridos} días)
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interés ({contrato.tasaInteres}%) : </span>
              <span className="tabular-nums font-medium">{fmt(interesHoy)} {moneda}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gastos Admin. ({contrato.tasaGastosAdmin}%) : </span>
              <span className="tabular-nums font-medium">{fmt(gastosHoy)} {moneda}</span>
            </div>
            <div
              className="flex justify-between border-t pt-1 text-sm font-bold"
              style={{ borderColor: '#1a3a1a' }}
            >
              <span>TOTAL INTERÉS:</span>
              <span className="tabular-nums" style={{ color: '#c9a227' }}>
                {fmt(totalHoy)} {moneda}
              </span>
            </div>
          </div>
        </div>

        {/* Nuevo vencimiento si paga hoy */}
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/20">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
          <div className="text-sm">
            <span className="text-muted-foreground">Si paga hoy, vence el </span>
            <span className="font-semibold text-green-700 dark:text-green-400">
              {fmtFecha(
                new Date(
                  new Date(obtenerHoyBolivia() + 'T00:00:00Z').getTime() +
                    contrato.diasPlazo * 86400000,
                )
                  .toISOString()
                  .split('T')[0],
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}