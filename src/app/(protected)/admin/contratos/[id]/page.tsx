// Carga el contrato por ID, muestra todos sus datos y expone las acciones disponibles segun el rol del usuario autenticado.
// isLoading se inicializa en true en useState (no dentro de useEffect) para evitar la cascada de renders prohibida.
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Ban,
  MessageSquarePlus,
  Gavel,
  FileText,
  Gem,
  User,
  Building2,
  CreditCard,
} from "lucide-react";
import { ClientOnly } from "@/components/ui/client-only";
import { ContratoEstadoBadge } from "@/components/contratos/contrato-estado-badge";
import { DiasVencimientoBadge } from "@/components/contratos/dias-vencimiento-badge";
import { ModalAnularContrato } from "@/components/contratos/modales/modal-anular-contrato";
import { ModalObservaciones } from "@/components/contratos/modales/modal-observaciones";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { useAuth } from "@/lib/auth/use-auth";
import { ROLES } from "@/lib/sidebar/sidebar-items";
import {
  formatearFechaBolivia,
  formatearFechaHoraBolivia,
} from "@/lib/utils/fecha-bolivia";
import type { ContratoDetalle } from "@/lib/api/types/contrato.types";

function fmt(n: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Etiqueta con valor para mostrar datos del contrato en pares
function CampoInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function ContratoDetallePage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();
    const contratoIdStr = params.id as string;
    const contratoId = Number(contratoIdStr);
    const idValido = !!contratoIdStr && !isNaN(contratoId) && contratoId > 0;

    // Estado de datos: isLoading inicia en true desde useState, no desde useEffect
    const [contrato, setContrato] = useState<ContratoDetalle | null>(null);
    // Si el ID ya es invalido desde el inicio, no tiene sentido mostrar loading
    const [isLoading, setIsLoading] = useState(idValido);
    const [error, setError] = useState<string | null>(null);

  // Estados de modales
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [modalObsOpen, setModalObsOpen] = useState(false);

  // Estado de adjudicacion con confirmacion en dos pasos
  const [confirmandoAdjudicar, setConfirmandoAdjudicar] = useState(false);
  const [adjudicando, setAdjudicando] = useState(false);

  // Roles del usuario actual
  const cargoActivo = user?.cargoActivo?.nombre ?? "";
  const esAdminOJefa =
    cargoActivo === ROLES.ADMINISTRADOR || cargoActivo === ROLES.JEFA;

  // Fetch del contrato: setState solo en callbacks async, nunca en el cuerpo del efecto
  // useEffect solo hace fetch, nunca setState sincrono en el body
    useEffect(() => {
        if (!idValido) return;

        type Resp = ContratoDetalle;
        apiRequest<Resp>(ENDPOINTS.contratos.porId(contratoId))
            .then((data) => {
            setContrato(data);
            })
            .catch((err: unknown) => {
            const msg =
                err instanceof Error ? err.message : "Error al cargar el contrato";
            setError(msg);
            })
            .finally(() => {
            setIsLoading(false);
            });
    }, [contratoId, idValido]);

  const adjudicar = () => {
    // setState en handler de usuario: correcto
    setAdjudicando(true);
    setConfirmandoAdjudicar(false);

    type Resp = { message: string };
    apiRequest<Resp>(ENDPOINTS.contratos.adjudicar(contratoId), {
      method: "POST",
    })
      .then(() => {
        showToast("Contrato adjudicado correctamente", "success");
        // Actualiza el estado localmente sin re-fetch completo
        setContrato((prev) =>
          prev ? { ...prev, estado: "ADJUDICADO" } : null
        );
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error al adjudicar";
        showToast(msg, "error");
      })
      .finally(() => setAdjudicando(false));
  };

  // Callback del modal de anulacion: refresca el contrato
  const handleAnulado = () => {
    setIsLoading(true);
    type Resp = ContratoDetalle;
    apiRequest<Resp>(ENDPOINTS.contratos.porId(contratoId))
      .then(setContrato)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  // Loading state
  if (isLoading) {
    return (
      <ClientOnly>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando contrato...
          </span>
        </div>
      </ClientOnly>
    );
  }

  // ID invalido: render directo sin loading ni fetch
    if (!idValido) {
        return (
            <ClientOnly>
            <div className="space-y-4">
                <button
                type="button"
                onClick={() => router.push("/admin/contratos")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                <ArrowLeft className="h-4 w-4" />
                Volver al listado
                </button>
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                ID de contrato invalido
                </div>
            </div>
            </ClientOnly>
        );
    }
    // Aqui va el guard que faltaba:
    // Si hubo error de red o el contrato no cargó, mostramos el error
    if (error || !contrato) {
        return (
        <ClientOnly>
            <div className="space-y-4">
            <button
                type="button"
                onClick={() => router.push("/admin/contratos")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al listado
            </button>
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error ?? "No se pudo cargar el contrato"}
            </div>
            </div>
        </ClientOnly>
        );
    }

    // Reemplaza las lineas donde usabas contrato.diasHastaVencimiento
    const esVigente = contrato.estado === "VIGENTE";
    const hoy = new Date();
    const fechaVenc = new Date(contrato.fechaPago);
    const diasHastaVencimiento = Math.floor(
    (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
    const estaVencido = esVigente && diasHastaVencimiento < 0;
    const moneda = contrato.moneda.codigoIso;
    const esUSD = moneda === "USD";

  return (
    <ClientOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/contratos")}
              className="mt-1 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Volver al listado"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-2xl font-bold text-foreground">
                  {contrato.nroContrato}
                </h1>
                <ContratoEstadoBadge estado={contrato.estado} />
              </div>
              <p className="text-sm text-muted-foreground">
                Agencia: {contrato.agencia.nombre}
                {contrato.nroFolio && (
                  <> &middot; Folio: {contrato.nroFolio}</>
                )}
              </p>
            </div>
          </div>

          {/* Botones de accion */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Anular: disponible para todos los roles */}
            {(esVigente) && (
              <button
                type="button"
                onClick={() => setModalAnularOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <Ban className="h-3.5 w-3.5" />
                Anular Contrato
              </button>
            )}

            {/* Observacion: solo Jefa y Admin */}
            {esAdminOJefa && (
              <button
                type="button"
                onClick={() => setModalObsOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {contrato.observaciones ? "Editar obs." : "Agregar obs."}
              </button>
            )}

            {/* Adjudicar: solo Jefa y Admin, solo si esta vencido */}
            {esAdminOJefa && estaVencido && contrato.estado === "VIGENTE" && (
              <div className="flex items-center gap-1">
                {!confirmandoAdjudicar ? (
                  <button
                    type="button"
                    onClick={() => setConfirmandoAdjudicar(true)}
                    className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    <Gavel className="h-3.5 w-3.5" />
                    Adjudicar Joyas
                  </button>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Confirmar adjudicacion?
                    </span>
                    <button
                      type="button"
                      onClick={adjudicar}
                      disabled={adjudicando}
                      className="flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {adjudicando && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      Si, adjudicar!
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoAdjudicar(false)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      No
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Placeholder del comprobante PDF (Sprint 4) */}
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-40"
              title="Disponible en el siguiente sprint"
            >
              <FileText className="h-3.5 w-3.5" />
              Imprimir PDF
            </button>
          </div>
        </div>

        {/* Indicador de vencimiento */}
        {esVigente && (
          <div className="flex items-center gap-3">
            <DiasVencimientoBadge
            dias={diasHastaVencimiento}
            estado={contrato.estado}
            />
            <span className="text-sm text-muted-foreground">
              Vencimiento: {formatearFechaBolivia(contrato.fechaPago)}
            </span>
          </div>
        )}

        {/* Grid de tarjetas de informacion */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Datos del cliente */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">CLIENTE</h3>
            </div>
            <div className="space-y-2">
              <CampoInfo
                label="Nombre Completo:"
                value={
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/admin/clientes/${contrato.cliente.id}`)
                    }
                    className="font-medium underline-offset-2 hover:underline"
                    style={{ color: "#c9a227" }}
                  >
                    {contrato.cliente.nombreCompleto}
                  </button>
                }
              />
              <CampoInfo label="CI:" value={contrato.cliente.ci} />
              {contrato.cliente.telefono && (
                <CampoInfo label="Teléfono:" value={contrato.cliente.telefono} />
              )}
            </div>
          </div>

          {/* Datos del prestamo */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                PRÉSTAMO
              </h3>
            </div>
            <div className="space-y-2">
              <CampoInfo
                label="Tipo de Moneda:"
                value={`${moneda} — ${contrato.moneda.descripcion}`}
              />
              <CampoInfo
                label="Capital Prestado:"
                value={`${fmt(contrato.montoPrestamo)} ${moneda}`}
              />
              <CampoInfo
                label="Saldo Pendiente:"
                value={
                  <span
                    className={
                      contrato.saldoCapital === 0
                        ? "font-semibold text-green-600 dark:text-green-400"
                        : "font-semibold text-foreground"
                    }
                  >
                    {fmt(contrato.saldoCapital)} {moneda}
                  </span>
                }
              />
              <CampoInfo
                label="Tasa Total:"
                value={`${contrato.tasaTotal}% (${contrato.tasaInteres}% legal + ${contrato.tasaGastosAdmin}% custodia)`}
              />
              {esUSD && (
                <CampoInfo
                  label="Tipo de Cambio:"
                  value={`1 USD = ${fmt(contrato.tasaCambio)} BOB`}
                />
              )}
            </div>
          </div>

          {/* Datos operativos */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                OPERACIÓN
              </h3>
            </div>
            <div className="space-y-2">
              <CampoInfo
                label="Cajero:"
                value={contrato.cajero.nombreCompleto}
              />
              <CampoInfo label="Agencia:" value={contrato.agencia.nombre} />
              <CampoInfo
                label="Desembolso:"
                value={formatearFechaBolivia(contrato.fechaDesembolso)}
              />
              <CampoInfo
                label="Categoria:"
                value={contrato.categoria || "—"}
              />
            </div>
          </div>
        </div>

        {/* Linea de credito */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            LINEA DE CRÉDITO
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                Préstamo Máximo (joyas):
              </p>
              <p className="text-lg font-bold text-foreground">
                {fmt(contrato.lineaCredito.montoMaximoPrestable)} BOB
              </p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Linea Solicitada</p>
              <p className="text-lg font-bold text-foreground">
                {fmt(contrato.lineaCredito.saldoLineaUsada)} BOB
              </p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                Linea Disponible
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {fmt(contrato.lineaCredito.lineaDisponible)} BOB
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de joyas en garantia */}
        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-2 px-4 py-3">
            <Gem className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Joyas en garantia ({contrato.joyas.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1a3a1a", color: "white" }}>
                  <th className="px-4 py-2.5 text-left font-semibold">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 text-center font-semibold">
                    Kilate
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    P. Bruto
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    P. Neto
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    Precio/g
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    Prestamo
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    Tasacion
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contrato.joyas.map((joya) => (
                  <tr key={joya.id} className="bg-card">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {joya.secJoya}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {joya.tipoJoya.descripcion}
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">
                      {joya.kilate.valor}k
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {fmt(joya.pesoBruto)}g
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {fmt(joya.pesoNeto)}g
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {fmt(joya.precioGramo)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">
                      {fmt(joya.valorPrestamo)} BOB
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {fmt(joya.valorTasacion)} BOB
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {joya.observaciones ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagos: placeholder Sprint 4 */}
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Historial de pagos
          </p>
          <p className="text-xs text-muted-foreground">
            El registro y consulta de pagos se implementa en el Sprint 4.
          </p>
        </div>

        {/* Observaciones internas */}
        {contrato.observaciones && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Observaciones internas
            </h3>
            <p className="text-sm text-muted-foreground">
              {contrato.observaciones}
            </p>
          </div>
        )}

        {/* Metadatos del registro */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            Creado: {formatearFechaHoraBolivia(contrato.fechaCreacion)}
          </span>
          <span>
            Actualizado:{" "}
            {formatearFechaHoraBolivia(contrato.fechaActualizacion)}
          </span>
          {contrato.motivoAnulacion && (
            <span className="text-red-600 dark:text-red-400">
              Motivo anulacion: {contrato.motivoAnulacion}
            </span>
          )}
        </div>
      </div>

      {/* Modales: el render condicional desmonta el componente al cerrar,
          lo que resetea el formulario interno automaticamente */}
      {modalAnularOpen && (
        <ModalAnularContrato
          open={modalAnularOpen}
          contratoId={contrato.id}
          nroContrato={contrato.nroContrato}
          onClose={() => setModalAnularOpen(false)}
          onAnulado={handleAnulado}
        />
      )}

      {modalObsOpen && (
        <ModalObservaciones
          open={modalObsOpen}
          contratoId={contrato.id}
          nroContrato={contrato.nroContrato}
          observacionActual={contrato.observaciones}
          onClose={() => setModalObsOpen(false)}
          onGuardado={(nuevaObs) =>
            setContrato((prev) =>
              prev ? { ...prev, observaciones: nuevaObs } : null
            )
          }
        />
      )}
    </ClientOnly>
  );
}