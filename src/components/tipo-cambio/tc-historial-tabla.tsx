// frontend/src/components/tipo-cambio/tc-historial-tabla.tsx
// Tabla paginada del historial de tipos de cambio registrados.
// Componente controlado: recibe datos y callbacks del page padre.
'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TipoCambioListaResponse } from '@/lib/api/types/pago.types';

// Convierte 'YYYY-MM-DD' a 'DD/MM/YYYY' para consistencia con el resto del sistema.
function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

interface Props {
  historial: TipoCambioListaResponse | null;
  cargando: boolean;
  pagina: number;
  porPagina: number;
  onCambiarPagina: (pagina: number) => void;
}

export function TcHistorialTabla({
  historial,
  cargando,
  pagina,
  porPagina,
  onCambiarPagina,
}: Props) {
  const totalPaginas = historial
    ? Math.ceil(historial.total / porPagina)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {/* Encabezado de la sección */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <span className="text-sm font-semibold text-white">
            Historial de tipos de cambio
          </span>
          {historial && (
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ backgroundColor: '#c9a227', color: '#0a0f0a' }}
            >
              {historial.total}
            </span>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {[
                  'Fecha',
                  'Compra BCB',
                  'Venta BCB',
                  'Venta Público',
                  'Registrado por',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Cargando historial...
                  </td>
                </tr>
              )}

              {!cargando && (historial?.datos?.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No hay registros aún.
                  </td>
                </tr>
              )}

              {!cargando && historial?.datos?.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b transition-colors last:border-b-0 hover:bg-muted/30 ${
                      idx % 2 !== 0 ? 'bg-muted/10' : ''
                    }`}
                  >
                    {/* Fecha */}
                    <td className="px-4 py-3 font-medium tabular-nums">
                    {formatFecha(item.fechaCambio)}
                  </td>

                    {/* Compra BCB */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {item.compraBCB.toFixed(2)}
                    </td>

                    {/* Venta BCB */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {item.ventaBCB.toFixed(2)}
                    </td>

                    {/* Venta Público: resaltado porque es el TC que se usa */}
                    <td
                      className="px-4 py-3 tabular-nums font-semibold"
                      style={{ color: '#c9a227' }}
                    >
                      {item.ventaPublico.toFixed(2)}
                    </td>

                    {/* Quién lo registró */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.registradoPor}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCambiarPagina(pagina - 1)}
              disabled={pagina <= 1}
              className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onCambiarPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}