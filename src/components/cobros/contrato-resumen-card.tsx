// frontend/src/components/cobros/contrato-resumen-card.tsx
'use client';
import { Calendar, User, Phone, TrendingDown, Gem } from 'lucide-react';
import type { ContratoParaPago } from '@/lib/api/types/pago.types';
import { formatearFechaBolivia } from '@/lib/utils/fecha-bolivia';

interface Props {
  contrato: ContratoParaPago;
}

function formatearMonto(monto: number): string {
  return monto.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function textoYColorDias(dias: number): { texto: string; clase: string } {
  if (dias < 0)
    return {
      texto: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`,
      clase: 'text-red-600 dark:text-red-400 font-semibold',
    };
  if (dias === 0)
    return { texto: 'Vence hoy', clase: 'text-red-500 dark:text-red-400 font-semibold' };
  if (dias === 1)
    return { texto: 'Vence mañana', clase: 'text-orange-500 dark:text-orange-400 font-semibold' };
  if (dias <= 7)
    return { texto: `Vence en ${dias} días`, clase: 'text-amber-500 dark:text-amber-400' };
  return { texto: `Vence en ${dias} días`, clase: 'text-muted-foreground' };
}

function claseBadgeEstado(estado: string): string {
  switch (estado.toUpperCase()) {
    case 'VIGENTE':
      return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
    case 'VENCIDO':
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
    case 'CANCELADO':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function obtenerHoyBolivia(): Date {
  // Bolivia es UTC-4 fijo. Calculamos la fecha local y la normalizamos a medianoche UTC
  // para comparar correctamente con las fechas del backend (que vienen como YYYY-MM-DD UTC).
  const ahora = new Date();
  const offsetBolivia = 4 * 60 * 60 * 1000;
  const hoyStr = new Date(ahora.getTime() - offsetBolivia).toISOString().split('T')[0];
  return new Date(hoyStr + 'T00:00:00Z');
}

function calcularDias(fechaPago: string): number {
  const hoy = obtenerHoyBolivia();
  const venc = new Date(fechaPago + 'T00:00:00Z');
  return Math.floor((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function calcularDiasTranscurridos(fechaPagoStr: string, diasPlazo: number): number {
  // Inicio del período = fecha de vencimiento actual - diasPlazo
  const vencimiento = new Date(fechaPagoStr + 'T00:00:00Z');
  const inicioPeriodo = new Date(vencimiento.getTime() - diasPlazo * 24 * 60 * 60 * 1000);
  const hoy = obtenerHoyBolivia();
  const diffDias = Math.floor((hoy.getTime() - inicioPeriodo.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDias);
}

function redondear(v: number): number {
  return Math.round(v * 100) / 100;
}

export function ContratoResumenCard({ contrato }: Props) {
  const dias = calcularDias(contrato.fechaPago);
  const { texto: textoDias, clase: claseDias } = textoYColorDias(dias);
  const diasTranscurridos = calcularDiasTranscurridos(contrato.fechaPago, contrato.diasPlazo);
  const interesMensual = redondear(contrato.saldoCapital * (contrato.tasaInteres / 100));
  const gastosMensuales = redondear(contrato.saldoCapital * (contrato.tasaGastosAdmin / 100));
  const totalMensualEstandar = redondear(interesMensual + gastosMensuales);

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="h-1 w-full" style={{ backgroundColor: '#1a3a1a' }} />

      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ backgroundColor: '#1a3a1a' }}
      >
        <div>
          <p className="font-mono text-xs font-medium text-white/70">Contrato</p>
          <p className="font-mono text-lg font-bold text-white">
            {contrato.nroContrato}
          </p>
          <p className="text-xs text-white/60">
            Folio: {contrato.nroFolio ?? '-'} 
          </p>
          <p className="text-xs text-white/60">
            Categoría: {contrato.categoria}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${claseBadgeEstado(contrato.estado)}`}>
          {contrato.estado}
        </span>
      </div>

      <div className="p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cliente
              </p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                {/* cliente.nombreCompleto: el backend devuelve objeto anidado */}
                <span className="font-medium text-foreground">
                  {contrato.cliente.nombreCompleto}
                </span>
              </div>
              <p className="pl-6 text-sm text-muted-foreground">
                CI: {contrato.cliente.ci}
              </p>
              {contrato.cliente.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {contrato.cliente.telefono}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Préstamo:
                </p>
                <p className="text-base font-bold tabular-nums text-foreground">
                  {formatearMonto(contrato.montoPrestamo)}
                </p>
                {/* moneda.codigoIso: el backend devuelve objeto anidado */}
                <p className="text-[11px] text-muted-foreground">
                  {contrato.moneda.codigoIso}
                </p>
              </div>
              <div className="rounded-md p-3" style={{ backgroundColor: '#1a3a1a10' }}>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Saldo actual:
                </p>
                <p className="text-base font-bold tabular-nums" style={{ color: '#c9a227' }}>
                  {formatearMonto(contrato.saldoCapital)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {contrato.moneda.codigoIso}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Vencimiento
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {formatearFechaBolivia(contrato.fechaPago)}
                </span>
              </div>
              <p className={`pl-6 text-sm ${claseDias}`}>{textoDias}</p>
              <p className="pl-6 text-sm text-muted-foreground">
                Desembolsado: {formatearFechaBolivia(contrato.fechaDesembolso)}
              </p>
            </div>

            {/* Tasas e interés mensual estándar */}
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tasas Mensuales:
              </p>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  Interés: {contrato.tasaInteres}% | Gastos Administrativos: {contrato.tasaGastosAdmin}%
                  {' '}|{' '}
                  <span className="font-semibold" style={{ color: '#c9a227' }}>
                    Total: {contrato.tasaInteres + contrato.tasaGastosAdmin}%
                  </span>
                </span>
              </div>

              {/* Interés estándar 30 días: referencia del "contrato verde" */}
              <div className="mt-1 rounded-md bg-muted/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Interés Estándar (30 días):
                </p>
                <p className="mt-0.5 text-sm">
                  <span className="tabular-nums font-medium text-foreground">
                    {formatearMonto(interesMensual)}
                  </span>
                  <span className="text-muted-foreground"> + </span>
                  <span className="tabular-nums font-medium text-foreground">
                    {formatearMonto(gastosMensuales)}
                  </span>
                  <span className="text-muted-foreground"> = </span>
                  <span
                    className="tabular-nums font-semibold"
                    style={{ color: '#c9a227' }}
                  >
                    {formatearMonto(totalMensualEstandar)} {contrato.moneda.codigoIso}
                  </span>
                </p>
              </div>

              {/* Días transcurridos del período actual */}
              <div className="mt-1 flex items-center justify-between rounded-md border border-dashed border-muted-foreground/30 px-3 py-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Días transcurridos (período actual):
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {diasTranscurridos} día{diasTranscurridos !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {contrato.joyas.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Gem className="h-3.5 w-3.5" style={{ color: '#c9a227' }} />
              Joyas en garantía: ({contrato.joyas.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {contrato.joyas.map((j) => (
                <div key={j.id} className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">
                    {j.tipoJoya.descripcion}{'   :  '}
                    <span className="font-normal text-muted-foreground">
                      {/* kilate.valor: objeto anidado del backend */}
                      {j.kilate.valor}k
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    P. Neto: {j.pesoNeto}g
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor: {formatearMonto(j.valorPrestamo)} Bs
                  </p>
                  {j.observaciones && (
                    <p className="truncate text-sm text-muted-foreground">
                      Observaciones: {j.observaciones}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* cajero.nombreCompleto: objeto anidado del backend */}
        <p className="mt-3 text-right text-sm text-muted-foreground">
          Registrado por: {contrato.cajero.nombreCompleto}
        </p>
      </div>
    </div>
  );
}