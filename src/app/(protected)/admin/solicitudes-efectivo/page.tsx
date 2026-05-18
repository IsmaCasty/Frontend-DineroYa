// frontend/src/app/(protected)/admin/solicitudes-efectivo/page.tsx
// Solicitudes de efectivo entre Jefa y Administrador (RF-42).
// Jefa: crea la solicitud. Admin: aprueba o rechaza por ID.
// NOTA: el backend no tiene GET /pagos/caja/solicitudes-efectivo aún.
// Cuando se agregue ese endpoint, esta página mostrará el historial completo.
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';

// ===== SCHEMAS =====
const crearSchema = z.object({
  monto: z.number({ message: 'Ingrese un monto válido' }).positive('Debe ser mayor a 0'),
  moneda: z.enum(['BOB', 'USD']),
  motivo: z.string().min(5, 'Describa el motivo (mínimo 5 caracteres)').max(300),
});

const responderSchema = z.object({
  idSolicitud: z.number({ message: 'Ingrese el ID de la solicitud' }).positive(),
  decision: z.enum(['APROBADA', 'RECHAZADA']),
  observacion: z.string().max(300).optional(),
});

type CrearValues = z.infer<typeof crearSchema>;
type ResponderValues = z.infer<typeof responderSchema>;

export default function SolicitudesEfectivoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [creando, setCreando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);

  const esAdmin =
    user?.cargoActivo.nombre.includes('ADMINISTRADOR') ?? false;
  const esJefa =
    user?.cargoActivo.nombre.includes('JEFE DE AGENCIA') ?? false;

  const formCrear = useForm<CrearValues>({
    resolver: zodResolver(crearSchema),
    defaultValues: { monto: 0, moneda: 'BOB', motivo: '' },
  });

  const formResponder = useForm<ResponderValues>({
    resolver: zodResolver(responderSchema),
    defaultValues: { idSolicitud: undefined, decision: 'APROBADA', observacion: '' },
  });

  const onCrear = async (values: CrearValues) => {
    setCreando(true);
    try {
      await apiRequest(ENDPOINTS.pagos.cajaSolicitudCrear, {
        method: 'POST',
        body: JSON.stringify({
          monto: values.monto,
          moneda: values.moneda,
          motivo: values.motivo,
        }),
      });
      showToast('Solicitud enviada al Administrador.', 'success');
      formCrear.reset({ monto: 0, moneda: 'BOB', motivo: '' });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.', 'error');
    } finally {
      setCreando(false);
    }
  };

  const onResponder = async (values: ResponderValues) => {
    setRespondiendo(true);
    try {
      await apiRequest(ENDPOINTS.pagos.cajaSolicitudGestionar(values.idSolicitud), {
        method: 'PATCH',
        body: JSON.stringify({
          decision: values.decision,
          observacion: values.observacion?.trim() || undefined,
        }),
      });
      showToast(
        `Solicitud ${values.decision === 'APROBADA' ? 'aprobada' : 'rechazada'} correctamente.`,
        'success',
      );
      formResponder.reset({ idSolicitud: undefined, decision: 'APROBADA', observacion: '' });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo responder la solicitud.', 'error');
    } finally {
      setRespondiendo(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Solicitudes de Efectivo
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          La Jefa solicita efectivo al Administrador para operaciones de caja
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario: Crear solicitud (solo Jefa) */}
        {esJefa && (
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Nueva solicitud de efectivo
            </h2>
            <form onSubmit={formCrear.handleSubmit(onCrear)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="monto" className="mb-1.5 block text-sm font-medium text-foreground">
                    Monto
                  </label>
                  <input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...formCrear.register('monto', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {formCrear.formState.errors.monto && (
                    <p className="mt-1 text-xs text-red-500">
                      {formCrear.formState.errors.monto.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="moneda" className="mb-1.5 block text-sm font-medium text-foreground">
                    Moneda
                  </label>
                  <select
                    id="moneda"
                    {...formCrear.register('moneda')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="BOB">BOB (Bs)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="motivo" className="mb-1.5 block text-sm font-medium text-foreground">
                  Motivo
                </label>
                <textarea
                  id="motivo"
                  rows={3}
                  {...formCrear.register('motivo')}
                  placeholder="Describa el motivo de la solicitud..."
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {formCrear.formState.errors.motivo && (
                  <p className="mt-1 text-xs text-red-500">
                    {formCrear.formState.errors.motivo.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={creando}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#1a3a1a' }}
              >
                {creando ? 'Enviando...' : 'Enviar solicitud al Administrador'}
              </button>
            </form>
          </div>
        )}

        {/* Formulario: Responder solicitud (solo Admin) */}
        {esAdmin && (
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Aprobar o rechazar solicitud
            </h2>
            <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Para ver el listado de solicitudes pendientes se necesita agregar el endpoint
                GET al backend. Por ahora ingresa el ID de la solicitud directamente.
              </p>
            </div>

            <form onSubmit={formResponder.handleSubmit(onResponder)} className="flex flex-col gap-4">
              <div>
                <label htmlFor="idSol" className="mb-1.5 block text-sm font-medium text-foreground">
                  ID de la solicitud
                </label>
                <input
                  id="idSol"
                  type="number"
                  min="1"
                  {...formResponder.register('idSolicitud', { valueAsNumber: true })}
                  placeholder="Ej: 3"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {formResponder.formState.errors.idSolicitud && (
                  <p className="mt-1 text-xs text-red-500">
                    {formResponder.formState.errors.idSolicitud.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Decisión
                </label>
                <div className="flex gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      value="APROBADA"
                      {...formResponder.register('decision')}
                      className="h-4 w-4"
                    />
                    <span className="flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Aprobar
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      value="RECHAZADA"
                      {...formResponder.register('decision')}
                      className="h-4 w-4"
                    />
                    <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="obsResp" className="mb-1.5 block text-sm font-medium text-foreground">
                  Observación{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <textarea
                  id="obsResp"
                  rows={2}
                  {...formResponder.register('observacion')}
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={respondiendo}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#1a3a1a' }}
              >
                {respondiendo ? 'Guardando...' : 'Confirmar decisión'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}