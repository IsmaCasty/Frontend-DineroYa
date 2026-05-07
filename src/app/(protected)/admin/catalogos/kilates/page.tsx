// Pantalla de kilates. Admin ve todo. Jefa solo ve el boton "Actualizar precio" por fila (la tabla lo controla internamente via useAuth).
// Los modales se montan condicionalmente para no tener estado residual.
"use client";
import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { useKilates } from "@/lib/hooks/use-kilates";
import { KilateModal } from "@/components/catalogos/kilate-modal";
import { KilatePrecioModal } from "@/components/catalogos/kilate-precio-modal";
import { KilatesTabla } from "@/components/catalogos/kilates-tabla";
import { ROLES } from "@/lib/sidebar/sidebar-items";
import type { Kilate } from "@/lib/api/types/catalogo.types";

type FiltroEstado = "todos" | "activos" | "inactivos";

export default function KilatesPage() {
  const { user } = useAuth();
  const { kilates, isLoading, error, refetch, upsertLocal } = useKilates();

  const esAdmin = user?.cargoActivo?.nombre === ROLES.ADMINISTRADOR;

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  // Dos modales separados: edicion completa y solo precio.
  // kilateSeleccionado: undefined = modal de alta. Con valor = edicion.
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [kilateSeleccionado, setKilateSeleccionado] = useState<Kilate | undefined>(undefined);

  const [modalPrecioAbierto, setModalPrecioAbierto] = useState(false);
  const [kilatePrecio, setKilatePrecio] = useState<Kilate | null>(null);

  const conteos = useMemo(() => {
    const total = kilates.length;
    const activos = kilates.filter((k) => k.estado).length;
    return { total, activos, inactivos: total - activos };
  }, [kilates]);

  const kilatesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return kilates.filter((k) => {
      if (filtroEstado === "activos" && !k.estado) return false;
      if (filtroEstado === "inactivos" && k.estado) return false;
      if (q === "") return true;
      // Buscamos por el valor numerico del kilate como string.
      return String(k.kilate).includes(q);
    });
  }, [kilates, busqueda, filtroEstado]);

  const abrirAlta = () => {
    setKilateSeleccionado(undefined);
    setModalEdicionAbierto(true);
  };

  const abrirEdicionCompleta = (kilate: Kilate) => {
    setKilateSeleccionado(kilate);
    setModalEdicionAbierto(true);
  };

  const abrirActualizarPrecio = (kilate: Kilate) => {
    setKilatePrecio(kilate);
    setModalPrecioAbierto(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kilates</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Catalogo de kilates de oro con su precio por gramo en bolivianos
          </p>
        </div>
        {/* Boton de alta: solo Admin */}
        {esAdmin && (
          <button
            type="button"
            onClick={abrirAlta}
            className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--color-header-accent)" }}
          >
            <Plus className="h-4 w-4" />
            Nuevo Kilate
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaConteo titulo="Cantidad Total de Kilates" valor={conteos.total} color="default" />
        <TarjetaConteo titulo="Cantidad de Kilates Activos" valor={conteos.activos} color="success" />
        <TarjetaConteo titulo="Cantidad de Kilates Inactivos" valor={conteos.inactivos} color="danger" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-70 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--color-muted-foreground)" }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Buscar por kilate (ej: 18)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm"
            style={{ borderColor: "var(--color-border)" }}
            aria-label="Buscar kilates"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border)" }}
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
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Cargando kilates...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
          <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
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
        <KilatesTabla
          kilates={kilatesFiltrados}
          onEditarCompleto={abrirEdicionCompleta}
          onActualizarPrecio={abrirActualizarPrecio}
          onActualizado={upsertLocal}
        />
      )}

      {/* Modal edicion completa (Admin): alta si kilateSeleccionado undefined */}
      <KilateModal
        open={modalEdicionAbierto}
        onOpenChange={setModalEdicionAbierto}
        kilate={kilateSeleccionado}
        onExito={upsertLocal}
      />

      {/* Modal de precio (Admin y Jefa): solo se monta si kilatePrecio tiene valor */}
      {kilatePrecio && (
        <KilatePrecioModal
          open={modalPrecioAbierto}
          onOpenChange={(o) => {
            setModalPrecioAbierto(o);
            // Al cerrar limpiamos el kilate para que el render condicional
            // desmonte el modal y resetee el form sin useEffect.
            if (!o) setKilatePrecio(null);
          }}
          kilate={kilatePrecio}
          onExito={upsertLocal}
        />
      )}
    </div>
  );
}

interface TarjetaConteoProps {
  titulo: string;
  valor: number;
  color: "default" | "success" | "danger";
}

function TarjetaConteo({ titulo, valor, color }: TarjetaConteoProps) {
  const colores = {
    default: "var(--color-foreground)",
    success: "#16a34a",
    danger: "#dc2626",
  };
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        {titulo}:
      </p>
      <p className="text-3xl font-bold mt-1" style={{ color: colores[color] }}>
        {valor}
      </p>
    </div>
  );
}