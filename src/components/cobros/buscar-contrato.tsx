// frontend/src/components/cobros/buscar-contrato.tsx
// Input de búsqueda de contrato para el flujo de cobros.
// Busca a medida que el usuario escribe (sin botón Buscar).
// Usa useRef + setTimeout para el debounce, evitando useEffect + setState.
'use client';
import { useState, useRef } from 'react';
import { Search, Loader2, FileText, Banknote } from 'lucide-react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ContratoBusquedaItem,
  ContratosBusquedaResponse,
} from '@/lib/api/types/pago.types';

interface Props {
  onSeleccionar: (idContrato: number) => void;
  deshabilitado?: boolean;
}

function determinarFiltro(texto: string): Record<string, string> {
  const sinEspacios = texto.replace(/\s/g, '');
  if (/^\d+$/.test(sinEspacios)) {
    return { ci: sinEspacios };
  }
  return { nroContrato: sinEspacios.toUpperCase() };
}

function formatearMonto(monto: number, moneda: string): string {
  const valor = monto.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${valor} ${moneda}`;
}

function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

function claseBadgeEstado(estado: string): string {
  switch (estado.toUpperCase()) {
    case 'VIGENTE':
      return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
    case 'VENCIDO':
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
    case 'CANCELADO':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
    case 'ANULADO':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function BuscarContrato({ onSeleccionar, deshabilitado = false }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ContratoBusquedaItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscarContratos = async (texto: string) => {
    setBuscando(true);
    setSinResultados(false);
    setErrorBusqueda(null);
    try {
      const filtro = determinarFiltro(texto);
      // Sin porPagina ni pagina: el backend rechaza esos params en este endpoint
      // (forbidNonWhitelisted). La búsqueda devuelve los primeros coincidentes sin paginación.
      const params = new URLSearchParams(filtro);
      type Resp = ContratosBusquedaResponse;
      const resp = await apiRequest<Resp>(
        `${ENDPOINTS.contratos.lista}?${params.toString()}`,
      );
      const items = resp.data ?? [];
      setResultados(items);
      setSinResultados(items.length === 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al buscar contratos';
      setErrorBusqueda(msg);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const handleCambio = (valor: string) => {
    setBusqueda(valor);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!valor.trim()) {
      setResultados([]);
      setSinResultados(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      void buscarContratos(valor.trim());
    }, 400);
  };

  const handleSeleccionar = (item: ContratoBusquedaItem) => {
    setBusqueda('');
    setResultados([]);
    setSinResultados(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    onSeleccionar(item.id);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => handleCambio(e.target.value)}
          disabled={deshabilitado}
          placeholder="N° Contrato (ej: DYLP2SM260004) o CI del cliente..."
          className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {errorBusqueda && (
          <p className="mt-1 px-1 text-sm text-red-500">{errorBusqueda}</p>
        )}
        {buscando && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {resultados.length > 0 && (
        <div className="overflow-hidden rounded-md border bg-card shadow-md">
          {resultados.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSeleccionar(item)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                idx !== resultados.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-foreground">
                      {item.nroContrato}
                    </p>
                    <p className="truncate text-sm text-foreground">
                      {/* cliente.nombreCompleto: la búsqueda devuelve objeto cliente anidado */}
                      {item.cliente.nombreCompleto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {/* cliente.ci y cantidadJoyas: nombres reales del backend */}
                      CI: {item.cliente.ci} · {item.cantidadJoyas} joya
                      {item.cantidadJoyas !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    {/* moneda: campo plano string en el backend, no monedaCodigo */}
                    {formatearMonto(item.saldoCapital, item.moneda)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence: {formatearFecha(item.fechaPago)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${claseBadgeEstado(item.estado)}`}
                  >
                    {item.estado}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {sinResultados && !buscando && (
        <p className="px-1 text-sm text-muted-foreground">
          No se encontraron contratos para &quot;{busqueda}&quot;.
        </p>
      )}
    </div>
  );
}