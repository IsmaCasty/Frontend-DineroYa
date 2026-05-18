'use client';

import { useState } from 'react';
import { useReportes } from '@/lib/hooks/use-reportes';
import type { ReporteDiarioResponse, FiltrosReporteDiario } from '@/lib/api/types/reporte.types';
import { CalendarDays, FileSpreadsheet, FileDown, Search } from 'lucide-react';

type Datos = ReporteDiarioResponse;

function fBob(n: number | undefined | null): string {
  return `Bs. ${(n ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fUsd(n: number | undefined | null): string {
  return `$ ${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReporteDiarioPage() {
  const { buscarDiario, exportarDiarioXlsx, exportarDiarioPdf, loadingDiario } = useReportes();

  // Por defecto muestra hoy (Bolivia UTC-4).
  const [fecha, setFecha] = useState(() =>
  new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().split('T')[0]
);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [generado, setGenerado] = useState(false);

  // La inicialización de useState con hoyBolivia es un lazy init,
  // la función de Date.now() aquí es en un evento, no en render.
  const filtrosActuales: FiltrosReporteDiario = { fecha: fecha || undefined };

  const handleGenerar = async () => {
    const res = await buscarDiario(filtrosActuales);
    setDatos(res);
    setGenerado(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={22} className="text-[#c9a227]" />
            <h1 className="text-2xl font-bold text-foreground">Reporte Diario</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen operativo por fecha con desglose por cajero
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarDiarioXlsx(filtrosActuales)}
            disabled={!generado || loadingDiario}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            onClick={() => exportarDiarioPdf(filtrosActuales)}
            disabled={!generado || loadingDiario}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Filtro de fecha */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a]"
            />
          </div>
          <button
            onClick={handleGenerar}
            disabled={loadingDiario}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-[#1a3a1a] text-white text-sm font-medium hover:bg-[#1a3a1a]/90 transition-colors disabled:opacity-50"
          >
            {loadingDiario
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Search size={14} />}
            Generar reporte
          </button>
        </div>
      </div>

      {/* Contenido: solo cuando hay datos */}
      {!generado ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 bg-card border border-border rounded-lg">
          <CalendarDays size={36} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Selecciona una fecha y presiona <span className="font-semibold">Generar reporte</span>
          </p>
        </div>
      ) : loadingDiario ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !datos ? null : (
        <>
          {/* Totales del día */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              Totales del día: {datos.fecha}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#1a3a1a]">
                <p className="text-xs text-muted-foreground uppercase">Contratos nuevos</p>
                <p className="text-2xl font-bold text-foreground mt-1">{datos.totales.contratosNuevos}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-red-400">
                <p className="text-xs text-muted-foreground uppercase">Devoluciones</p>
                <p className="text-2xl font-bold text-foreground mt-1">{datos.totales.devoluciones}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#c9a227]">
                <p className="text-xs text-muted-foreground uppercase">Cobros ({datos.totales.cobrosCantidad})</p>
                <p className="text-lg font-bold text-foreground mt-1">{fBob(datos.totales.montoCobradoBob)}</p>
                <p className="text-sm text-muted-foreground">{fUsd(datos.totales.montoCobradoUsd)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-blue-400">
                <p className="text-xs text-muted-foreground uppercase">Prestado</p>
                <p className="text-lg font-bold text-foreground mt-1">{fBob(datos.totales.montoPrestadoBob)}</p>
                <p className="text-sm text-muted-foreground">{fUsd(datos.totales.montoPrestadoUsd)}</p>
              </div>
            </div>
          </div>

          {/* Desglose por cajero */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Desglose por cajero
              </h3>
            </div>
            {!datos.porCajero.length ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">Sin actividad de cajeros en esta fecha</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a3a1a] text-white">
                      <th className="text-left py-3 px-3 text-xs font-semibold uppercase">Cajero</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Contratos</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Prestado BOB</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Prestado USD</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Cobros</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Cobrado BOB</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Cobrado USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.porCajero.map((c) => (
                      <tr key={c.idCuenta} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground">{c.cajeroNombre}</td>
                        <td className="py-2 px-3 text-right text-foreground">{c.contratosNuevos}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs">{fBob(c.montoPrestadoBob)}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs">{fUsd(c.montoPrestadoUsd)}</td>
                        <td className="py-2 px-3 text-right text-foreground">{c.cobrosCantidad}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold">{fBob(c.montoCobradoBob)}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold">{fUsd(c.montoCobradoUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}