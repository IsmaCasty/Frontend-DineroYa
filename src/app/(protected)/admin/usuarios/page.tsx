// Pantalla de gestion de usuarios para administradores.
// Listado con busqueda, filtro por estado, toggle activar/desactivar.
// (este turno solo lectura + toggle).
"use client";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useUsuarios } from "@/lib/hooks/use-usuarios";
import { useToast } from "@/lib/toast/use-toast";
import { UsuariosTable } from "@/components/admin/usuarios-table";

// Tipos del filtro de estado. "todos" muestra activos e inactivos.
type FiltroEstado = "todos" | "activos" | "inactivos";

export default function UsuariosPage() {
  const { showToast } = useToast();
  const { usuarios, isLoading, error, refetch, actualizarUsuarioLocal } =
    useUsuarios();

  // Texto de busqueda (en memoria, no llama al backend).
  // Filtra por userName, nombreCompleto y CI sin distinguir mayus/minus.
  const [busqueda, setBusqueda] = useState("");

  // Filtro por estado.
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  // Lista filtrada derivada. useMemo para evitar recalcular en cada render.
  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      // Filtro por estado
      if (filtroEstado === "activos" && !u.estado) return false;
      if (filtroEstado === "inactivos" && u.estado) return false;

      // Filtro por busqueda
      if (q.length === 0) return true;
      return (
        u.userName.toLowerCase().includes(q) ||
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.ci.toLowerCase().includes(q)
      );
    });
  }, [usuarios, busqueda, filtroEstado]);

  // Conteos para mostrar arriba como info rapida.
  const conteos = useMemo(() => {
    const activos = usuarios.filter((u) => u.estado).length;
    const inactivos = usuarios.length - activos;
    return { total: usuarios.length, activos, inactivos };
  }, [usuarios]);

  return (
    <div className="space-y-6">
      {/* Header de la pantalla con titulo y boton crear */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las cuentas del sistema y sus cargos asignados
          </p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--color-dy-gold-500)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-dy-gold-600)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-dy-gold-500)";
          }}
        >
          <UserPlus className="h-4 w-4" />
          Crear usuario
        </Link>
      </header>

      {/* Cards de conteo: total, activos, inactivos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ConteoCard label="Cantidad Total de Usuarios:" valor={conteos.total} />
        <ConteoCard label="Cantidad de Usuarios Activos:" valor={conteos.activos} color="#16a34a" />
        <ConteoCard
          label="Cantidad de Usuarios Inactivos:"
          valor={conteos.inactivos}
          color="#dc2626"
        />
      </div>

      {/* Barra de filtros: busqueda + estado + refrescar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Input de busqueda */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-muted-foreground)" }}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar por usuario, nombre o CI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="block w-full rounded-md border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1"
            style={{
              backgroundColor: "var(--color-background)",
              borderColor: "var(--color-input)",
              color: "var(--color-foreground)",
            }}
          />
        </div>

        {/* Selector de filtro por estado */}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
          style={{
            backgroundColor: "var(--color-background)",
            borderColor: "var(--color-input)",
            color: "var(--color-foreground)",
          }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>

        {/* Boton refrescar */}
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading}
          aria-label="Refrescar lista"
          title="Refrescar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: "var(--color-input)",
            color: "var(--color-foreground)",
          }}
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Estados de carga / error / contenido */}
      {isLoading && usuarios.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border bg-card py-16 text-card-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-700"
        >
          <p className="font-medium">No se pudo cargar la lista</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <UsuariosTable
          usuarios={usuariosFiltrados}
          onUsuarioActualizado={actualizarUsuarioLocal}
        />
      )}
    </div>
  );
}

// =====================================================================
// Subcomponente: card de conteo. Lo extraemos para no repetir markup.
// =====================================================================
interface ConteoCardProps {
  label: string;
  valor: number;
  color?: string;
}

function ConteoCard({ label, valor, color }: ConteoCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className="mt-1 text-2xl font-bold"
        style={{ color: color ?? "var(--color-foreground)" }}
      >
        {valor}
      </p>
    </div>
  );
}