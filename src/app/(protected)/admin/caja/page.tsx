'use client';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Landmark, FileText, RefreshCw, Lock, Unlock } from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { tokenStorage } from '@/lib/auth/token-storage';
import { ClientOnly } from '@/components/ui/client-only';
import type {
  ArqueoResponse,
  CajaArqueo,
  AbrirCajaInput,
  CerrarCajaInput,
  MontoSugeridoResponse,
} from '@/lib/api/types/pago.types';

// ─── Tipos alias para evitar ambigüedad de genéricos en JSX ──────────────────
type ArqueoResp = ArqueoResponse;
type MontoResp  = MontoSugeridoResponse;

// ─── Schemas ─────────────────────────────────────────────────────────────────

// Cierre requiere ambos montos; el usuario los cuenta físicamente.
const cerrarSchema = z.object({
  montoReportadoBob: z
    .number({ message: 'Ingrese monto BOB válido' })
    .min(0, 'Debe ser 0 o mayor'),
  montoReportadoUsd: z
    .number({ message: 'Ingrese monto USD válido' })
    .min(0, 'Debe ser 0 o mayor'),
  observaciones: z.string().optional(),
});
type CerrarFormValues = z.infer<typeof cerrarSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fBob(n: number | undefined | null): string {
  return `Bs. ${(n ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fUsd(n: number | undefined | null): string {
  return `$ ${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function descargarPdfArqueo(onError: (msg: string) => void) {
  try {
    const token = tokenStorage.getAccessToken();
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
    const res   = await fetch(`${base}${ENDPOINTS.pagos.cajaArqueoPdf}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) throw new Error('Error al obtener el PDF');
    const blob      = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
  } catch {
    onError('No se pudo abrir el PDF del arqueo.');
  }
}

// ─── Componente fila de caja ─────────────────────────────────────────────────
function FilaCaja({
  caja,
  onCerrar,
}: {
  caja: CajaArqueo;
  onCerrar: (caja: CajaArqueo) => void;
}) {
  const abierta = caja.estado === 'ABIERTO';
  return (
    <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
      <td className="py-2 px-3 text-xs text-muted-foreground font-mono">
        #{caja.idCuentaEmpleado}
      </td>
      <td className="py-2 px-3 text-center">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            abierta
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {caja.estado}
        </span>
      </td>
      <td className="py-2 px-3 text-right font-mono text-xs">{fBob(caja.montoInicialCajaBob)}</td>
      <td className="py-2 px-3 text-right font-mono text-xs">{fUsd(caja.montoInicialCajaUsd)}</td>
      <td className="py-2 px-3 text-right font-mono text-xs">{fBob(caja.totalCobradoBob)}</td>
      <td className="py-2 px-3 text-right font-mono text-xs">{fUsd(caja.totalCobradoUsd)}</td>
      <td className="py-2 px-3 text-right font-mono text-xs">{fBob(caja.totalPrestadoBob)}</td>
      <td className="py-2 px-3 text-right font-mono text-xs">{fUsd(caja.totalPrestadoUsd)}</td>
      <td className="py-2 px-3 text-right">
        {caja.estado === 'CERRADO' && (
          <>
            <p className={`text-xs font-bold ${(caja.diferenciaBob ?? 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {fBob(caja.diferenciaBob)}
            </p>
            <p className={`text-xs font-bold ${(caja.diferenciaUsd ?? 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {fUsd(caja.diferenciaUsd)}
            </p>
          </>
        )}
      </td>
      <td className="py-2 px-3 text-center">
        {abierta && (
          <button
            onClick={() => onCerrar(caja)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 transition-colors"
          >
            <Lock size={12} />
            Cerrar
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Modal Abrir Caja ─────────────────────────────────────────────────────────
// Tipo ligero para poblar el selector de cajeros.
interface CajeroOpcion {
  id: number;
  nombreCompleto: string;
}

function ModalAbrirCaja({
  open,
  esJefaOAdmin,
  idPropioUsuario,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  esJefaOAdmin: boolean;
  idPropioUsuario: number | null;
  onClose: () => void;
  onConfirm: (idTarget: number) => void;
  loading: boolean;
}) {
  const [cajeros, setCajeros]             = useState<CajeroOpcion[]>([]);
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
  const [montoSugerido, setMontoSugerido] = useState<MontoResp | null>(null);
  const [cargandoCajeros, setCargandoCajeros] = useState(false);
  const [cargandoMonto, setCargandoMonto]     = useState(false);

  // Carga la lista de cajeros solo para Jefa/Admin.
  useEffect(() => {
  if (!open) return;

  if (!esJefaOAdmin) {
    setIdSeleccionado(idPropioUsuario);
    return;
  }

  setCargandoCajeros(true);

  const fetchCajeros = async () => {
    try {
      // El endpoint devuelve array directo, no { data: [] }.
      // Cada item tiene idCuenta, nombreCompleto y cargosActivos[].
      type UsuarioItem = {
        idCuenta: number;
        nombreCompleto: string;
        estado: boolean;
        cargosActivos: Array<{ id: number; nombre: string }>;
      };
      type R = UsuarioItem[];

      const res = await apiRequest<R>(ENDPOINTS.admin.usuarios);

      const filtrados: CajeroOpcion[] = res
        .filter(
          (u) =>
            u.estado &&
            u.cargosActivos.some((c) => c.nombre === 'CAJERO'),
        )
        .map((u) => ({
          id: u.idCuenta,           // idCuenta, no id
          nombreCompleto: u.nombreCompleto,
        }));

      setCajeros(filtrados);

      if (filtrados.length === 1) {
        setIdSeleccionado(filtrados[0].id);
      }
    } catch {
      // silencioso: el selector queda vacío
    } finally {
      setCargandoCajeros(false);
    }
  };

  void fetchCajeros();
}, [open, esJefaOAdmin, idPropioUsuario]);

  // Cada vez que cambia el cajero seleccionado, busca su monto sugerido.
  useEffect(() => {
    if (!idSeleccionado) { setMontoSugerido(null); return; }

    setCargandoMonto(true);
    const fetchMonto = async () => {
      try {
        type M = MontoResp;
        const data = await apiRequest<M>(
          ENDPOINTS.pagos.montoAperturaSugerido(idSeleccionado),
        );
        setMontoSugerido(data);
      } catch {
        setMontoSugerido(null);
      } finally {
        setCargandoMonto(false);
      }
    };
    void fetchMonto();
  }, [idSeleccionado]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Unlock size={20} className="text-[#c9a227]" />
          <h2 className="text-lg font-bold text-foreground">Apertura de caja</h2>
        </div>

        {/* Selector de cajero (solo para Jefa/Admin) */}
        {esJefaOAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Seleccionar cajero
            </label>
            {cargandoCajeros ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 border-2 border-border border-t-[#c9a227] rounded-full animate-spin" />
                Cargando cajeros...
              </div>
            ) : (
              <select
                value={idSeleccionado ?? ''}
                onChange={(e) =>
                  setIdSeleccionado(e.target.value ? Number(e.target.value) : null)
                }
                className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a]"
              >
                <option value="">-- Seleccionar cajero --</option>
                {cajeros.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreCompleto}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Monto sugerido */}
        <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Monto inicial sugerido (último cierre registrado)
          </p>
          {!idSeleccionado ? (
            <p className="text-sm text-muted-foreground italic">
              Selecciona un cajero para ver el monto sugerido
            </p>
          ) : cargandoMonto ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 border-2 border-border border-t-[#c9a227] rounded-full animate-spin" />
              Consultando monto...
            </div>
          ) : montoSugerido ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border border-border rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground">BOB</p>
                <p className="text-base font-bold text-[#c9a227]">
                  {fBob(montoSugerido.montoBob)}
                </p>
              </div>
              <div className="bg-background border border-border rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground">USD</p>
                <p className="text-base font-bold text-blue-500">
                  {fUsd(montoSugerido.montoUsd)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Sin cierre anterior: la caja inicia en Bs. 0.00 / $ 0.00
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => idSeleccionado && onConfirm(idSeleccionado)}
            disabled={loading || cargandoMonto || !idSeleccionado}
            className="px-4 py-2 rounded-md text-sm bg-[#1a3a1a] text-white font-medium hover:bg-[#1a3a1a]/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Abriendo...
                </span>
              : 'Confirmar apertura'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Cerrar Caja ────────────────────────────────────────────────────────
function ModalCerrarCaja({
  open,
  caja,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  caja: CajaArqueo | null;
  onClose: () => void;
  onConfirm: (values: CerrarFormValues) => Promise<void>;
  loading: boolean;
}) {
  const form = useForm<CerrarFormValues>({
    resolver: zodResolver(cerrarSchema),
    defaultValues: { montoReportadoBob: 0, montoReportadoUsd: 0, observaciones: '' },
  });

  if (!open || !caja) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Lock size={20} className="text-red-500" />
          <h2 className="text-lg font-bold text-foreground">Cerrar caja</h2>
        </div>

        {/* Resumen de la caja que se cierra */}
        <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cajero</p>
            <p className="font-semibold text-foreground">#{caja.idCuentaEmpleado}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cobrado BOB</p>
            <p className="font-semibold text-[#c9a227]">{fBob(caja.totalCobradoBob)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monto inicial BOB</p>
            <p className="font-semibold">{fBob(caja.montoInicialCajaBob)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cobrado USD</p>
            <p className="font-semibold text-blue-500">{fUsd(caja.totalCobradoUsd)}</p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(onConfirm)}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Monto reportado BOB
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...form.register('montoReportadoBob', { valueAsNumber: true })}
                className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a]"
              />
              {form.formState.errors.montoReportadoBob && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.montoReportadoBob.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Monto reportado USD
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...form.register('montoReportadoUsd', { valueAsNumber: true })}
                className="h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a]"
              />
              {form.formState.errors.montoReportadoUsd && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.montoReportadoUsd.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Observaciones (opcional)
            </label>
            <textarea
              rows={2}
              {...form.register('observaciones')}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md text-sm bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Cerrando...</span>
                : 'Confirmar cierre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CajaPage() {
  const { user }       = useAuth();
  const { showToast }  = useToast();

  const esJefaOAdmin =
    user?.cargoActivo.nombre.includes('ADMINISTRADOR') ||
    user?.cargoActivo.nombre.includes('JEFE DE AGENCIA') ||
    false;

  const [arqueo, setArqueo]         = useState<ArqueoResp | null>(null);
  const [cargando, setCargando]     = useState(true);
  const [abriendo, setAbriendo]     = useState(false);
  const [cerrando, setCerrando]     = useState(false);

  // Modal abrir
  const [modalAbrir, setModalAbrir]     = useState(false);
  const [, setIdTarget]         = useState<number | null>(null);

  // Modal cerrar
  const [modalCerrar, setModalCerrar]   = useState(false);
  const [cajaACerrar, setCajaACerrar]   = useState<CajaArqueo | null>(null);

  // Caja propia del usuario actual
  const cajaPropia: CajaArqueo | null =
    arqueo?.cajas.find((c) => c.idCuentaEmpleado === user?.id) ??
    (esJefaOAdmin ? null : arqueo?.cajas[0] ?? null);

  const hayAbierta = cajaPropia?.estado === 'ABIERTO';

  const cargarArqueo = useCallback(async () => {
    setCargando(true);
    try {
      type R = ArqueoResp;
      const data = await apiRequest<R>(ENDPOINTS.pagos.cajaArqueo);
      setArqueo(data);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar el arqueo.', 'error');
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => { void cargarArqueo(); }, [cargarArqueo]);

  // Abre el modal de apertura asignando el idTarget correcto.
  const handleClickAbrir = () => {
    const id = user?.id ?? null;
    setIdTarget(id);
    setModalAbrir(true);
  };

 // El modal ahora recibe esJefaOAdmin e idPropioUsuario en vez de idTarget.
// El idTarget lo resuelve el modal internamente y lo pasa al onConfirm.

const handleConfirmarApertura = async (idTarget: number) => {
  setAbriendo(true);
  try {
    const body: AbrirCajaInput = { idCuentaEmpleadoTarget: idTarget };
    await apiRequest(ENDPOINTS.pagos.cajaAbrir, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    showToast('Caja abierta. Puede comenzar a operar.', 'success');
    setModalAbrir(false);
    void cargarArqueo();
  } catch (e) {
    showToast(e instanceof Error ? e.message : 'No se pudo abrir la caja.', 'error');
  } finally {
    setAbriendo(false);
  }
};

  // Jefa puede cerrar cualquier caja del arqueo desde la tabla.
  const handleClickCerrar = (caja: CajaArqueo) => {
    setCajaACerrar(caja);
    setModalCerrar(true);
  };

  const handleConfirmarCierre = async (values: CerrarFormValues) => {
    if (!cajaACerrar) return;
    setCerrando(true);
    try {
      const body: CerrarCajaInput = {
        idCuentaEmpleadoTarget: cajaACerrar.idCuentaEmpleado,
        montoReportadoBob:      values.montoReportadoBob,
        montoReportadoUsd:      values.montoReportadoUsd,
        observaciones:          values.observaciones,
      };
      await apiRequest(ENDPOINTS.pagos.cajaCerrar, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showToast('Caja cerrada correctamente.', 'success');
      setModalCerrar(false);
      setCajaACerrar(null);
      void cargarArqueo();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo cerrar la caja.', 'error');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Landmark size={22} className="text-[#c9a227]" />
            <h1 className="text-2xl font-bold text-foreground">Caja y Arqueo</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {esJefaOAdmin
              ? 'Arqueo consolidado de todas las cajas del día'
              : 'Estado de tu caja del día'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void cargarArqueo()}
            disabled={cargando}
            className="flex items-center gap-1 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          </button>
          {esJefaOAdmin && (
            <button
              onClick={() => void descargarPdfArqueo((msg) => showToast(msg, 'error'))}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <FileText size={14} />
              PDF Arqueo
            </button>
          )}
          {!hayAbierta && (
            <button
              onClick={handleClickAbrir}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#1a3a1a] text-white text-sm font-medium hover:bg-[#1a3a1a]/90 transition-colors"
            >
              <Unlock size={14} />
              Abrir caja
            </button>
          )}
        </div>
      </div>

      {/* Totales globales (solo Jefa/Admin) */}
      {esJefaOAdmin && arqueo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#c9a227]">
            <p className="text-xs text-muted-foreground uppercase">Cobrado BOB</p>
            <p className="text-xl font-bold text-foreground mt-1">{fBob(arqueo.totalCobradoBobGlobal)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-blue-400">
            <p className="text-xs text-muted-foreground uppercase">Cobrado USD</p>
            <p className="text-xl font-bold text-foreground mt-1">{fUsd(arqueo.totalCobradoUsdGlobal)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#1a3a1a]">
            <p className="text-xs text-muted-foreground uppercase">Prestado BOB</p>
            <p className="text-xl font-bold text-foreground mt-1">{fBob(arqueo.totalPrestadoBobGlobal)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-purple-400">
            <p className="text-xs text-muted-foreground uppercase">Prestado USD</p>
            <p className="text-xl font-bold text-foreground mt-1">{fUsd(arqueo.totalPrestadoUsdGlobal)}</p>
          </div>
        </div>
      )}

      {/* Caja propia del cajero */}
      {!esJefaOAdmin && cajaPropia && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#1a3a1a]">
            <p className="text-xs text-muted-foreground uppercase">Estado</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${
              cajaPropia.estado === 'ABIERTO'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {cajaPropia.estado}
            </span>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-[#c9a227]">
            <p className="text-xs text-muted-foreground uppercase">Cobrado BOB</p>
            <p className="text-xl font-bold text-[#c9a227] mt-1">{fBob(cajaPropia.totalCobradoBob)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 border-t-4 border-t-blue-400">
            <p className="text-xs text-muted-foreground uppercase">Cobrado USD</p>
            <p className="text-xl font-bold text-blue-500 mt-1">{fUsd(cajaPropia.totalCobradoUsd)}</p>
          </div>
        </div>
      )}

      {/* Tabla de arqueo (Jefa/Admin ven todas, cajero ve solo la suya) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {cargando ? (
          <div className="p-6 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : !arqueo?.cajas.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Landmark size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay cajas registradas hoy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a3a1a] text-white">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase">Cajero</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase">Estado</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Inicial BOB</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Inicial USD</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Cobrado BOB</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Cobrado USD</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Prestado BOB</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Prestado USD</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase">Diferencia</th>
                  <th className="py-3 px-3" />
                </tr>
              </thead>
              <tbody>
                {(esJefaOAdmin
                  ? arqueo.cajas
                  : arqueo.cajas.filter((c) => c.idCuentaEmpleado === user?.id)
                ).map((caja) => (
                  <FilaCaja key={caja.id} caja={caja} onCerrar={handleClickCerrar} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales — condicional para reset natural (sin useEffect) */}
      <ClientOnly>
        {modalAbrir && (
          <ModalAbrirCaja
            open={modalAbrir}
            esJefaOAdmin={esJefaOAdmin}
            idPropioUsuario={user?.id ?? null}
            onClose={() => setModalAbrir(false)}
            onConfirm={(idTarget) => void handleConfirmarApertura(idTarget)}
            loading={abriendo}
          />
        )}
        {modalCerrar && (
          <ModalCerrarCaja
            open={modalCerrar}
            caja={cajaACerrar}
            onClose={() => { setModalCerrar(false); setCajaACerrar(null); }}
            onConfirm={handleConfirmarCierre}
            loading={cerrando}
          />
        )}
      </ClientOnly>
    </div>
  );
}