// Pantalla principal del catalogo de tipos de joya. Replica el patron de /admin/usuarios: header con accion principa
// Solo Admin la ve (lo controla el idebar y, idealmente, un guard de ruta server-side en el futuro).
"use client";
import { useMemo, useState } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import { useTiposJoya } from "@/lib/hooks/use-tipos-joya";
import { TipoJoyaModal } from "@/components/catalogos/tipo-joya-modal";
import { TiposJoyaTabla } from "@/components/catalogos/tipos-joya-tabla";
import type { TipoJoya } from "@/lib/api/types/catalogo.types";

type FiltroEstado = "todos" | "activos" | "inactivos";

export default function TiposJoyaPage() {
  const { tipos, isLoading, error, refetch, upsertLocal } = useTiposJoya();

  // Filtros locales: el catalogo es chico, podemos filtrar en cliente
  // sin pegar al backend en cada cambio.
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  // Estado del modal alta/edicion. Si tipoSeleccionado es undefined = alta.
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoJoya | undefined>(undefined);

  // Lista filtrada para la tabla. useMemo evita recomputar en cada render
  // a menos que cambien tipos, busqueda o filtroEstado.
  const tiposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tipos.filter((t) => {
      if (filtroEstado === "activos" && !t.estado) return false;
      if (filtroEstado === "inactivos" && t.estado) return false;
      if (q === "") return true;
      return t.descripcion.toLowerCase().includes(q);
    });
  }, [tipos, busqueda, filtroEstado]);

  // Conteos derivados. Calculados durante el render porque dependen
  // exclusivamente de tipos y se memoizan con useMemo.
  const conteos = useMemo(() => {
    const total = tipos.length;
    const activos = tipos.filter((t) => t.estado).length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [tipos]);

  const abrirAlta = () => {
    setTipoSeleccionado(undefined);
    setModalAbierto(true);
  };

  const abrirEdicion = (tipo: TipoJoya) => {
    setTipoSeleccionado(tipo);
    setModalAbierto(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header de la pagina con titulo y boton primario */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tipos de Joya
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Catalogo de tipos de joyas que se reciben como garantia de
            prestamos
          </p>
        </div>
        <button
          type="button"
          onClick={abrirAlta}
          className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--color-header-accent)",
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo Tipo Joya
        </button>
      </div>

      {/* Tarjetas de conteo. Mismo patron que /admin/usuarios */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaConteo
          titulo="Cantidad Total de Tipos de Joya"
          valor={conteos.total}
          color="default"
        />
        <TarjetaConteo
          titulo="Cantidad de Tipos de Joya Activos"
          valor={conteos.activos}
          color="success"
        />
        <TarjetaConteo
          titulo="Cantidad de Tipos de Joya Inactivos"
          valor={conteos.inactivos}
          color="danger"
        />
      </div>

      {/* Barra de filtros: busqueda libre, select de estado, boton refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-70 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--color-muted-foreground)" }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Buscar por descripcion..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm"
            style={{ borderColor: "var(--color-border)" }}
            aria-label="Buscar tipos de joya"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border)" }}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="p-2 rounded-md border hover:bg-secondary disabled:opacity-50"
          style={{ borderColor: "var(--color-border)" }}
          title="Refrescar"
          aria-label="Refrescar lista"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Estado de la tabla: loading, error, o datos */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
          <p
            className="text-sm"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Cargando tipos de joya...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
          <p className="text-sm" style={{ color: "#dc2626" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 text-sm underline"
            style={{ color: "var(--color-header-accent)" }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <TiposJoyaTabla
          tipos={tiposFiltrados}
          onEditar={abrirEdicion}
          onActualizado={upsertLocal}
        />
      )}

      <TipoJoyaModal
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        tipoJoya={tipoSeleccionado}
        onExito={upsertLocal}
      />
    </div>
  );
}

interface TarjetaConteoProps {
  titulo: string;
  valor: number;
  color: "default" | "success" | "danger";
}

function TarjetaConteo({ titulo, valor, color }: TarjetaConteoProps) {
  // Mapeo de colores: default = color de texto del tema (se adapta a oscuro),
  // success = verde (activos), danger = rojo (inactivos).
  const colores: Record<TarjetaConteoProps["color"], string> = {
    default: "var(--color-foreground)",
    success: "#16a34a",
    danger: "#dc2626",
  };
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <p
        className="text-sm"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {titulo}:
      </p>
      <p
        className="text-3xl font-bold mt-1"
        style={{ color: colores[color] }}
      >
        {valor}
      </p>
    </div>
  );
}