// frontend/src/app/(protected)/admin/devoluciones/page.tsx
'use client';
import { useState, useRef, useCallback } from 'react';
import {
  Search, Loader2, Diamond, CheckCircle2, ArrowLeft, Printer, RefreshCw,
} from 'lucide-react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { ContratoParaPago, DevolucionResponse } from '@/lib/api/types/pago.types';

// Coincide con ContratoListadoItemDto del backend (campos anidados)
interface ContratoCanceladoItem {
  id: number;
  nroContrato: string;
  estado: string;
  montoPrestamo: number;
  saldoCapital: number;
  moneda: string;           // campo plano en el backend
  cliente: {
    id: number;
    ci: string;
    nombreCompleto: string;
  };
}

interface ContratosResp {
  data: ContratoCanceladoItem[] | null;
  total: number;
}

function fmt(monto: number): string {
  return monto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function abrirPdfProtegido(url: string, onError: (msg: string) => void) {
  try {
    const token = tokenStorage.getAccessToken();
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await fetch(`${base}${url}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) throw new Error('Error al obtener el PDF');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
  } catch {
    onError('No se pudo abrir el comprobante PDF.');
  }
}

type Paso = 'buscar' | 'confirmar' | 'completado';

export default function DevolucionesPage() {
  const { showToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ContratoCanceladoItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  const [paso, setPaso] = useState<Paso>('buscar');
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoParaPago | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [resultado, setResultado] = useState<DevolucionResponse | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscarContratosCancelados = useCallback(async (texto: string) => {
    setBuscando(true);
    setSinResultados(false);
    setErrorBusqueda(null);
    try {
      const sinEspacios = texto.replace(/\s/g, '');
      // Sin porPagina ni pagina: el backend rechaza esos params (forbidNonWhitelisted).
      const params = new URLSearchParams({ estado: 'CANCELADO' });
      if (/^\d+$/.test(sinEspacios)) {
        params.set('ci', sinEspacios);
      } else {
        params.set('nroContrato', sinEspacios.toUpperCase());
      }
      type Resp = ContratosResp;
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
  }, []);

  const handleCambioBusqueda = (valor: string) => {
    setBusqueda(valor);
    setErrorBusqueda(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!valor.trim()) {
      setResultados([]);
      setSinResultados(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      void buscarContratosCancelados(valor.trim());
    }, 400);
  };

  const handleSeleccionarContrato = async (id: number) => {
    setBusqueda('');
    setResultados([]);
    setSinResultados(false);
    setCargandoDetalle(true);
    try {
      type Resp = ContratoParaPago;
      const detalle = await apiRequest<Resp>(ENDPOINTS.contratos.porId(id));
      setContratoSeleccionado(detalle);
      setPaso('confirmar');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo cargar el contrato.', 'error');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleRegistrarDevolucion = async () => {
    if (!contratoSeleccionado) return;
    setRegistrando(true);
    try {
      type Resp = DevolucionResponse;
      const res = await apiRequest<Resp>(ENDPOINTS.pagos.devolucionCrear, {
        method: 'POST',
        body: JSON.stringify({
          idContrato: contratoSeleccionado.id,
          observaciones: observaciones.trim() || undefined,
        }),
      });
      setResultado(res);
      setPaso('completado');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo registrar la devolución.', 'error');
    } finally {
      setRegistrando(false);
    }
  };

  const resetear = () => {
    setPaso('buscar');
    setContratoSeleccionado(null);
    setObservaciones('');
    setResultado(null);
    setBusqueda('');
    setResultados([]);
    setSinResultados(false);
    setErrorBusqueda(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Devolución de Joyas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Entrega las joyas al cliente cuando el préstamo ha sido cancelado por completo
        </p>
      </div>

      {paso === 'buscar' && (
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="mb-1 text-sm font-medium text-foreground">Buscar contrato CANCELADO</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Escribe el N° de contrato o el CI del cliente. Solo aparecen contratos con saldo en cero.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => handleCambioBusqueda(e.target.value)}
                disabled={cargandoDetalle}
                placeholder="N° Contrato o CI del cliente..."
                className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              {(buscando || cargandoDetalle) && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {errorBusqueda && (
              <p className="mt-2 px-1 text-sm text-red-500">{errorBusqueda}</p>
            )}

            {resultados.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-md border bg-card shadow-sm">
                {resultados.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleSeleccionarContrato(item.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                      idx !== resultados.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-semibold">{item.nroContrato}</p>
                        {/* cliente.nombreCompleto: objeto anidado del backend */}
                        <p className="text-sm font-medium">{item.cliente.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">CI: {item.cliente.ci}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {/* moneda: campo plano en la lista */}
                        <p className="text-sm font-semibold">{fmt(item.montoPrestamo)} {item.moneda}</p>
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                          CANCELADO
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {sinResultados && !buscando && (
              <p className="mt-2 px-1 text-sm text-muted-foreground">
                No se encontraron contratos cancelados para &quot;{busqueda}&quot;.
              </p>
            )}
          </div>
        </div>
      )}

      {paso === 'confirmar' && contratoSeleccionado && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <button
            type="button"
            onClick={resetear}
            className="flex w-fit items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Buscar otro contrato
          </button>

          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-4" style={{ backgroundColor: '#1a3a1a' }}>
              <p className="font-mono text-xs text-white/60">Contrato para devolución</p>
              <p className="font-mono text-lg font-bold text-white">
                {contratoSeleccionado.nroContrato}
              </p>
              {/* cliente.nombreCompleto y cliente.ci: estructura anidada */}
              <p className="text-sm text-white/70">
                {contratoSeleccionado.cliente.nombreCompleto} · CI: {contratoSeleccionado.cliente.ci}
              </p>
            </div>

            <div className="p-5">
              <div className="mb-5">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Diamond className="h-3.5 w-3.5" style={{ color: '#c9a227' }} />
                  Joyas a devolver ({contratoSeleccionado.joyas.length})
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {contratoSeleccionado.joyas.map((j) => (
                    <div key={j.id} className="rounded-md border bg-muted/20 px-3 py-2.5">
                      <p className="text-sm font-medium text-foreground">
                        {j.tipoJoya.descripcion}{' '}
                        <span className="font-normal text-muted-foreground">
                          {/* kilate.valor: objeto anidado */}
                          {j.kilate.valor}k
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bruto: {j.pesoBruto}g · Neto: {j.pesoNeto}g
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valor préstamo: {fmt(j.valorPrestamo)} Bs
                      </p>
                      {j.observaciones && (
                        <p className="truncate text-xs text-muted-foreground">{j.observaciones}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="obs-dev" className="mb-1.5 block text-sm font-medium text-foreground">
                  Observaciones{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <textarea
                  id="obs-dev"
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Estado de las joyas al momento de la devolución..."
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleRegistrarDevolucion()}
                disabled={registrando}
                className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#1a3a1a' }}
              >
                {registrando ? 'Registrando devolución...' : 'Confirmar devolución de joyas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paso === 'completado' && resultado && (
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#1a3a1a' }}
            >
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Devolución registrada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Devolución N°{' '}
              <span className="font-mono font-semibold text-foreground">{resultado.nroDevolucion}</span>
            </p>

            <div className="mx-auto my-5 max-w-xs rounded-md bg-muted/40 px-4 py-3 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{resultado.clienteNombre}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Contrato</span>
                <span className="font-mono text-xs">{resultado.nroContrato}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Joyas devueltas</span>
                <span className="font-medium">{resultado.joyas.length}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Cajero</span>
                <span className="text-xs text-muted-foreground">{resultado.cajeroNombre}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() =>
                  void abrirPdfProtegido(
                    ENDPOINTS.pagos.devolucionComprobante(contratoSeleccionado?.id ?? 0),
                    (msg) => showToast(msg, 'error'),
                  )
                }
                className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Printer className="h-4 w-4" />
                Imprimir comprobante
              </button>
              <button
                type="button"
                onClick={resetear}
                className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#1a3a1a' }}
              >
                <RefreshCw className="h-4 w-4" />
                Nueva devolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}