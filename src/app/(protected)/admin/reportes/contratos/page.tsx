'use client';

import { useState } from 'react';
import { useReportes } from '@/lib/hooks/use-reportes';
import type {
  ReporteContratosResponse,
  FiltrosReporteContratos,
} from '@/lib/api/types/reporte.types';
import { FileText, FileSpreadsheet, FileDown, Search } from 'lucide-react';

type Datos = ReporteContratosResponse;

const ESTADO_BADGE: Record<string, string> = {
  VIGENTE:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  VENCIDO:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELADO:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  RENOVADO:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  YA_DEVUELTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function fMonto(n: number | undefined | null, moneda: string): string {
  const val = n ?? 0;
  return moneda === 'USD'
    ? `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `Bs. ${val.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReporteContratosPage() {
  const { buscarContratos, exportarContratosXlsx, exportarContratosPdf, loadingContratos } =
    useReportes();

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');
  const [datos, setDatos] = useState<Datos | null>(null);
  const [generado, setGenerado] = useState(false);

  const filtrosActuales: FiltrosReporteContratos = {
    desde: desde || undefined,
    hasta: hasta || undefined,
    estado: estado || undefined,
  };

  const handleGenerar = async () => {
    const res = await buscarContratos(filtrosActuales);
    setDatos(res);
    setGenerado(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={22} className="text-[#c9a227]" />
            <h1 className="text-2xl font-bold text-foreground">Reporte de Contratos</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cartera filtrable por rango de desembolso y estado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarContratosXlsx(filtrosActuales)}
            disabled={!generado || loadingContratos}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            onClick={() => exportarContratosPdf(filtrosActuales)}
            disabled={!generado || loadingContratos}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Tarjeta total */}
      {datos && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#1a3a1a]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total de contratos
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">{datos.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {desde && hasta ? `${desde} al ${hasta}` : desde ? `Desde ${desde}` : hasta ? `Hasta ${hasta}` : 'Sin filtro de fecha'}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] min-w-40"
            >
              <option value="">Todos los estados</option>
              <option value="VIGENTE">Vigente</option>
              <option value="VENCIDO">Vencido</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="RENOVADO">Renovado</option>
              <option value="YA_DEVUELTO">Ya devuelto</option>
            </select>
          </div>
          <button
            onClick={handleGenerar}
            disabled={loadingContratos}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-[#1a3a1a] text-white text-sm font-medium hover:bg-[#1a3a1a]/90 transition-colors disabled:opacity-50"
          >
            {loadingContratos
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Search size={14} />}
            Generar reporte
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {!generado ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileText size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aplica filtros y presiona <span className="font-semibold">Generar reporte</span>
            </p>
          </div>
        ) : loadingContratos ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : !datos?.items.length ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Sin resultados para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a3a1a] text-white">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase">Contrato</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase">Cliente</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase">CI</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase">Moneda</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Prestado</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Saldo</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase">Estado</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase">Desembolso</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase">Vencimiento</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase">Cajero</th>
                </tr>
              </thead>
              <tbody>
                {datos.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3 font-mono text-xs">{item.nroContrato}</td>
                    <td className="py-2 px-3 max-w-40 truncate">{item.clienteNombre}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{item.clienteCi}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs font-bold ${item.moneda === 'USD' ? 'text-blue-500' : 'text-[#c9a227]'}`}>
                        {item.moneda}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {fMonto(item.montoPrestamo, item.moneda)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {fMonto(item.saldoCapital, item.moneda)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[item.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-muted-foreground">{item.fechaDesembolso}</td>
                    <td className="py-2 px-3 text-center text-xs text-muted-foreground">{item.fechaPago}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground truncate max-w-30">{item.cajeroNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}