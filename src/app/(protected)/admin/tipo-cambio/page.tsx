// frontend/src/app/(protected)/admin/tipo-cambio/page.tsx
// Pantalla de gestión del tipo de cambio BOB/USD (RF-30).
// Solo accesible para JEFA DE AGENCIA y ADMINISTRADOR.
// Muestra el TC del día, el formulario de registro (si no hay TC hoy),y el historial paginado.
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { TcHistorialTabla } from '@/components/tipo-cambio/tc-historial-tabla';
import type {
  TipoCambioHoy,
  TipoCambioListaResponse,
} from '@/lib/api/types/pago.types';

// ===== SCHEMA ZOD =====
// Validaciones numéricas + cross-field con superRefine (RF-30).
// Usamos superRefine, nunca .refine() con función como segundo argumento.
const tcSchema = z
  .object({
    compraBCB: z
      .number({ message: 'Ingrese un número válido' })
      .positive('Debe ser mayor a 0'),
    ventaBCB: z
      .number({ message: 'Ingrese un número válido' })
      .positive('Debe ser mayor a 0'),
    ventaPublico: z
      .number({ message: 'Ingrese un número válido' })
      .positive('Debe ser mayor a 0'),
  })
  .superRefine((data, ctx) => {
    // La compra siempre debe ser menor a la venta
    if (data.compraBCB >= data.ventaBCB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La compra BCB debe ser menor a la venta BCB',
        path: ['compraBCB'],
      });
    }
    // La venta al público >= venta BCB (es para el cliente, puede ser igual)
    if (data.ventaPublico < data.ventaBCB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La venta público debe ser mayor o igual a la venta BCB',
        path: ['ventaPublico'],
      });
    }
  });

type TcFormValues = z.infer<typeof tcSchema>;

// ===== CONSTANTES =====
const POR_PAGINA = 10;

// ===== PAGE =====
export default function TipoCambioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // 'cargando' = aún no se verificó. null = no hay TC hoy. TipoCambioHoy = hay TC.
  const [tcHoy, setTcHoy] = useState<TipoCambioHoy | null | 'cargando'>(
    'cargando',
  );
  const [historial, setHistorial] = useState<TipoCambioListaResponse | null>(
    null,
  );
  const [pagina, setPagina] = useState(1);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Guard de rol: solo Jefa y Admin pueden registrar TC.
  // Si el usuario no tiene rol aún (null) mostramos acceso restringido.
  const tieneAcceso =
    user?.cargoActivo.nombre.includes('ADMINISTRADOR') ||
    user?.cargoActivo.nombre.includes('JEFE DE AGENCIA') ||
    false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TcFormValues>({
    resolver: zodResolver(tcSchema),
  });

  // Verifica si ya existe un TC para hoy. No lanza error si es 404 (normal).
  const cargarTcHoy = useCallback(async () => {
    setTcHoy('cargando');
    try {
      type Resp = TipoCambioHoy;
      const data = await apiRequest<Resp>(ENDPOINTS.pagos.tipoCambioHoy);
      setTcHoy(data);
    } catch {
      // 404 = no hay TC hoy. Cualquier otro error también muestra el form.
      setTcHoy(null);
    }
  }, []);

  const cargarHistorial = useCallback(
    async (p: number) => {
      setCargandoHistorial(true);
      try {
        type Resp = TipoCambioListaResponse;
        const data = await apiRequest<Resp>(
          `${ENDPOINTS.pagos.tipoCambioHistorial}?pagina=${p}&limite=${POR_PAGINA}`
        );
        setHistorial(data);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'Error al cargar el historial.',
          'error',
        );
      } finally {
        setCargandoHistorial(false);
      }
    },
    [showToast],
  );

  // Carga inicial
  useEffect(() => {
    void cargarTcHoy();
  }, [cargarTcHoy]);

  // Recarga el historial cuando cambia la página
  useEffect(() => {
    void cargarHistorial(pagina);
  }, [cargarHistorial, pagina]);

  const onSubmit = async (values: TcFormValues) => {
    setEnviando(true);
    try {
      type Resp = TipoCambioHoy;
      const nuevo = await apiRequest<Resp>(ENDPOINTS.pagos.tipoCambioCrear, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setTcHoy(nuevo);
      reset();
      showToast('Tipo de cambio registrado correctamente.', 'success');
      // Recargar historial desde la primera página
      setPagina(1);
      void cargarHistorial(1);
    } catch (e) {
      showToast(
        e instanceof Error
          ? e.message
          : 'No se pudo registrar el tipo de cambio.',
        'error',
      );
    } finally {
      setEnviando(false);
    }
  };

  // ===== RENDER: acceso restringido =====
  if (!user) return null; // Aún cargando el usuario

  if (!tieneAcceso) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold text-foreground">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Solo la Jefa de Agencia y el Administrador pueden gestionar el tipo
          de cambio.
        </p>
      </div>
    );
  }

  // Fecha de hoy legible para el encabezado
  const hoyTexto = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tipo de Cambio
        </h1>
        <p className="mt-0.5 text-sm capitalize text-muted-foreground">
          {hoyTexto}
        </p>
      </div>

      {/* Layout dos columnas en desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Columna izquierda: tarjeta TC del día + formulario */}
        <div className="flex flex-col gap-4">
          <TcHoyCard tcHoy={tcHoy} />

          {/* Formulario: solo si no hay TC hoy */}
          {(tcHoy === null || (tcHoy !== 'cargando' && !tcHoy.yaUsadoEnPago)) && (
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Registrar el Tipo de Cambio de Hoy
              </h2>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                {/* Compra BCB */}
                <div>
                  <label
                    htmlFor="compraBCB"
                    className="mb-1 block text-sm font-medium text-foreground"
                  >
                    Compra BCB{' '}
                    <span className="font-normal text-muted-foreground">
                      (Bs/$)
                    </span>
                  </label>
                  <input
                    id="compraBCB"
                    type="number"
                    step="0.001"
                    placeholder="6.86"
                    {...register('compraBCB', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.compraBCB && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.compraBCB.message}
                    </p>
                  )}
                </div>

                {/* Venta BCB */}
                <div>
                  <label
                    htmlFor="ventaBCB"
                    className="mb-1 block text-sm font-medium text-foreground"
                  >
                    Venta BCB{' '}
                    <span className="font-normal text-muted-foreground">
                      (Bs/$)
                    </span>
                  </label>
                  <input
                    id="ventaBCB"
                    type="number"
                    step="0.001"
                    placeholder="6.96"
                    {...register('ventaBCB', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.ventaBCB && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.ventaBCB.message}
                    </p>
                  )}
                </div>

                {/* Venta Público */}
                <div>
                  <label
                    htmlFor="ventaPublico"
                    className="mb-1 block text-sm font-medium text-foreground"
                  >
                    Venta Público{' '}
                    <span className="font-normal text-muted-foreground">
                      (Bs/$)
                    </span>
                  </label>
                  <input
                    id="ventaPublico"
                    type="number"
                    step="0.001"
                    placeholder="6.97"
                    {...register('ventaPublico', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.ventaPublico && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.ventaPublico.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este es el TC que se usará en todos los cálculos del día.
                    No puede modificarse si ya se registraron pagos.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: '#1a3a1a' }}
                >
                  {enviando ? 'Registrando...' : 'Registrar Tipo de Cambio'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Columna derecha: historial */}
        <TcHistorialTabla
          historial={historial}
          cargando={cargandoHistorial}
          pagina={pagina}
          porPagina={POR_PAGINA}
          onCambiarPagina={setPagina}
        />
      </div>
    </div>
  );
}

// ===== SUBCOMPONENTE: TcHoyCard =====
// Vive en el mismo archivo porque solo se usa aquí y es pequeño.
// Muestra el TC del día registrado o un aviso de que falta registrarlo.

interface TcHoyCardProps {
  tcHoy: TipoCambioHoy | null | 'cargando';
}

function TcHoyCard({ tcHoy }: TcHoyCardProps) {
  if (tcHoy === 'cargando') {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Verificando tipo de cambio del día...
        </p>
      </div>
    );
  }

  if (tcHoy === null) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Sin tipo de cambio hoy
          </span>
        </div>
        <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
          No se ha registrado el tipo de cambio para hoy. Hasta que se
          registre, no será posible procesar pagos en dólares.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm">
      {/* Franja dorada en el borde superior */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-lg"
        style={{ backgroundColor: '#c9a227' }}
      />

      {/* Cabecera de la tarjeta */}
      <div className="mb-4 mt-1 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: '#1a3a1a' }}
        >
          <ArrowLeftRight className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Tipo de Cambio Vigente
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {tcHoy.fechaCambio}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Registrado
        </span>
      </div>

      {/* Tres valores del TC */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { label: 'Compra BCB', valor: tcHoy.compraBCB },
            { label: 'Venta BCB', valor: tcHoy.ventaBCB },
            { label: 'Venta Público', valor: tcHoy.ventaPublico },
          ] as const
        ).map((item) => (
          <div
            key={item.label}
            className="rounded-md bg-muted/40 p-3 text-center"
          >
            <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {item.valor.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">Bs/$</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        La venta público ({tcHoy.ventaPublico.toFixed(2)} Bs/$) es el TC
        utilizado en todos los cálculos del día.
      </p>
    </div>
  );
}