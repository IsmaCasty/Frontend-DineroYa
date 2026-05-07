// Pantalla de consulta de auditoria del sistema.
// Filtros server-side por usuario, accion, fechas. Paginacion incluida.
// Filas expandibles muestran datosAnteriores/datosNuevos en JSON.
// Por defecto muestra las acciones de las ultimas 24 horas para que la primera carga sea rapida.
"use client";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuditoria } from "@/lib/hooks/use-auditoria";
import { useUsuarios } from "@/lib/hooks/use-usuarios";
import {
  ACCIONES_AUDITORIA,
  type AccionCatalogo,
} from "@/lib/admin/auditoria-acciones";
import { ahoraISO, fechaHaceNDias } from "@/lib/utils/fecha";
import { AuditoriaTable } from "@/components/admin/auditoria-table";
import { Paginador } from "@/components/admin/paginador";
import type { AuditoriaFiltros } from "@/lib/api/types/auditoria.types";

// Estado interno de los filtros del formulario. Convertimos a AuditoriaFiltros
// al pasarlos al hook. Separamos para tener control fino del input local.
interface FiltrosLocales {
  idCuenta: number | null;
  accion: string;
  // Strings ISO con datetime-local (sin zona). Los convertimos a UTC al enviar.
  desde: string;
  hasta: string;
  page: number;
  pageSize: number;
}

// Helper para convertir el valor de un input datetime-local a ISO UTC.
// El navegador devuelve "2026-04-27T10:30" (sin zona horaria explicita).
// new Date() lo interpreta como local y toISOString() lo convierte a UTC.
function localToISO(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

// Inverso: convierte un ISO a formato compatible con datetime-local.
// Quita los segundos y la zona Z para que el input lo acepte.
function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // toLocaleString para obtener la fecha/hora en zona local del usuario.
  // Despues formateamos a YYYY-MM-DDTHH:MM (sin segundos ni zona).
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AuditoriaPage() {
  // Cargar lista de usuarios para el dropdown del filtro "usuario".
  const { usuarios } = useUsuarios();

  // Estado inicial: ultimas 24 horas. Convertimos a formato datetime-local.
  const [filtros, setFiltros] = useState<FiltrosLocales>(() => ({
    idCuenta: null,
    accion: "",
    desde: isoToLocal(fechaHaceNDias(1)),
    hasta: isoToLocal(ahoraISO()),
    page: 1,
    pageSize: 20,
  }));

  // Convertir filtros locales al shape que espera el hook (ISO UTC).
  // useMemo para evitar recrear el objeto en cada render y disparar refetch.
  const filtrosBackend = useMemo<AuditoriaFiltros>(
    () => ({
      idCuenta: filtros.idCuenta ?? undefined,
      accion: filtros.accion || undefined,
      desde: filtros.desde ? localToISO(filtros.desde) : undefined,
      hasta: filtros.hasta ? localToISO(filtros.hasta) : undefined,
      page: filtros.page,
      pageSize: filtros.pageSize,
    }),
    [filtros],
  );

  const { pagina, isLoading, error, refetch } = useAuditoria(filtrosBackend);

  // Helpers para actualizar filtros. Cada uno resetea page=1 si corresponde.
  const setIdCuenta = (idCuenta: number | null) =>
    setFiltros((prev) => ({ ...prev, idCuenta, page: 1 }));
  const setAccion = (accion: string) =>
    setFiltros((prev) => ({ ...prev, accion, page: 1 }));
  const setDesde = (desde: string) =>
    setFiltros((prev) => ({ ...prev, desde, page: 1 }));
  const setHasta = (hasta: string) =>
    setFiltros((prev) => ({ ...prev, hasta, page: 1 }));
  const setPage = (page: number) =>
    setFiltros((prev) => ({ ...prev, page }));
  const setPageSize = (pageSize: number) =>
    setFiltros((prev) => ({ ...prev, pageSize, page: 1 }));

  // Restablecer filtros a "ultimas 24 horas" sin filtros adicionales.
  const restablecer = () => {
    setFiltros({
      idCuenta: null,
      accion: "",
      desde: isoToLocal(fechaHaceNDias(1)),
      hasta: isoToLocal(ahoraISO()),
      page: 1,
      pageSize: 20,
    });
  };

  // Agrupar acciones por modulo para el optgroup del select.
  const accionesAgrupadas = useMemo(() => {
    const map = new Map<AccionCatalogo["modulo"], AccionCatalogo[]>();
    for (const accion of ACCIONES_AUDITORIA) {
      const lista = map.get(accion.modulo) ?? [];
      lista.push(accion);
      map.set(accion.modulo, lista);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Registro de acciones realizadas en el sistema. De un click en una fila
          para ver el detalle.
        </p>
      </header>

      {/* Cards de resumen. Solo total por ahora; si quisieras desglose
          por exitoso/fallido haria falta extender el backend con un campo
          "resultado" en AuditoriaAccion. Lo dejamos para futuro. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <CardConteo label="Cantidad Total de Registros:" valor={pagina?.total ?? 0} />
        <CardConteo
          label="Página Actual:"
          valor={pagina ? `${pagina.page} / ${pagina.totalPages || 1}` : "—"}
        />
        <CardConteo
          label="Cantidad de Registros por Página:"
          valor={filtros.pageSize}
        />
      </div>

      {/* Barra de filtros */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Filtro por usuario */}
          <div>
            <label
              htmlFor="filtro-usuario"
              className="block text-xs font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Filtrar por Usuario:
            </label>
            <select
              id="filtro-usuario"
              value={filtros.idCuenta ?? ""}
              onChange={(e) =>
                setIdCuenta(e.target.value ? Number(e.target.value) : null)
              }
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-input)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map((u) => (
                <option key={u.idCuenta} value={u.idCuenta}>
                  {u.userName} — {u.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por accion */}
          <div>
            <label
              htmlFor="filtro-accion"
              className="block text-xs font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Filtrar por Accion:
            </label>
            <select
              id="filtro-accion"
              value={filtros.accion}
              onChange={(e) => setAccion(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-input)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="">Todas las acciones</option>
              {accionesAgrupadas.map(([modulo, acciones]) => (
                <optgroup key={modulo} label={modulo}>
                  {acciones.map((a) => (
                    <option key={a.valor} value={a.valor}>
                      {a.etiqueta}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Filtro por fecha desde */}
          <div>
            <label
              htmlFor="filtro-desde"
              className="block text-xs font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Filtrar por Fecha Desde:
            </label>
            <input
              id="filtro-desde"
              type="datetime-local"
              value={filtros.desde}
              onChange={(e) => setDesde(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-input)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {/* Filtro por fecha hasta */}
          <div>
            <label
              htmlFor="filtro-hasta"
              className="block text-xs font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Filtrar por Fecha Hasta:
            </label>
            <input
              id="filtro-hasta"
              type="datetime-local"
              value={filtros.hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-input)",
                color: "var(--color-foreground)",
              }}
            />
          </div>
        </div>

        {/* Botones de accion para los filtros */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={restablecer}
            className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            style={{
              borderColor: "var(--color-input)",
              color: "var(--color-foreground)",
            }}
          >
            Restablecer (ultimas 24h)
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isLoading}
            aria-label="Refrescar"
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "var(--color-input)",
              color: "var(--color-foreground)",
            }}
          >
            <RefreshCw
              className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refrescar
          </button>
        </div>
      </div>

      {/* Estados de carga / error / contenido */}
      {isLoading && pagina === null ? (
        <div className="flex items-center justify-center rounded-lg border bg-card py-16 text-card-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-700"
        >
          <p className="font-medium">No se pudo cargar la auditoria</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : pagina ? (
        <>
          <AuditoriaTable items={pagina.data} />
          <Paginador
            page={pagina.page}
            totalPages={pagina.totalPages}
            total={pagina.total}
            pageSize={pagina.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : null}
    </div>
  );
}

// =====================================================================
// Subcomponente: card de conteo. Igual que en la pantalla de Usuarios.
// =====================================================================
interface CardConteoProps {
  label: string;
  valor: number | string;
}

function CardConteo({ label, valor }: CardConteoProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
    </div>
  );
}