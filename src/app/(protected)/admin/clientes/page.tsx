// Listado principal de clientes. Patron identico a usuarios y catalogos: header con boton de alta, tarjetas de conteo, filtros, tabla, paginador.
// Los conteos (total, activos, inactivos) vienen del backend via el total paginado. Para los conteos exactos de activos/inactivos hacemos dos
// requests extra al montar: uno con estado=true y otro con estado=false.
// Esto es un tradeoff aceptable: el backend es rapido y la pagina es administrativa, no de alta concurrencia.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserPlus } from "lucide-react";
import { useClientes } from "@/lib/hooks/use-clientes";
import { ClienteFiltros } from "@/components/clientes/cliente-filtros";
import { ClientesTabla } from "@/components/clientes/clientes-tabla";
import { Paginador } from "@/components/admin/paginador";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ClientesPaginadosResponse } from "@/lib/api/types/cliente.types";

export default function ClientesPage() {
  const router = useRouter();
  const {
    clientes,
    total,
    page,
    pageSize,
    isLoading,
    error,
    cambiarPagina,
    aplicarFiltros,
    refetch,
    upsertLocal,
  } = useClientes();

  // Conteos separados por estado. Los pedimos al montar y al refrescar.
  const [conteoActivos, setConteoActivos] = useState<number | null>(null);
  const [conteoInactivos, setConteoInactivos] = useState<number | null>(null);

  const cargarConteos = async () => {
    try {
      const [respActivos, respInactivos] = await Promise.all([
        apiRequest<ClientesPaginadosResponse>(
          `${ENDPOINTS.clientes.base}?page=1&pageSize=1&estado=true`,
        ),
        apiRequest<ClientesPaginadosResponse>(
          `${ENDPOINTS.clientes.base}?page=1&pageSize=1&estado=false`,
        ),
      ]);
      setConteoActivos(respActivos.total);
      setConteoInactivos(respInactivos.total);
    } catch {
      // Si fallan los conteos no bloqueamos la pantalla: simplemente
      // mostramos "—" en las tarjetas. No es critico.
      setConteoActivos(null);
      setConteoInactivos(null);
    }
  };

  // Carga inicial de conteos.
  useEffect(() => {
    void cargarConteos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    refetch();
    void cargarConteos();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestión de Clientes
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Registro y administración de clientes de la agencia
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/clientes/nuevo")}
          className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--color-header-accent)",
          }}
        >
          <UserPlus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Tarjetas de conteo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaConteo
          titulo="Cantidad Total de Clientes"
          valor={total}
          color="default"
        />
        <TarjetaConteo
          titulo="Cantidad de Clientes Activos"
          valor={conteoActivos}
          color="success"
        />
        <TarjetaConteo
          titulo="Cantidad de Clientes Inactivos"
          valor={conteoInactivos}
          color="danger"
        />
      </div>

      {/* Barra de filtros y boton refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <ClienteFiltros onFiltrar={aplicarFiltros} />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-md border hover:bg-secondary disabled:opacity-50 shrink-0"
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

      {/* Estado de la tabla */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
          <p
            className="text-sm"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Cargando clientes...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
          <p className="text-sm" style={{ color: "#dc2626" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-3 text-sm underline"
            style={{ color: "var(--color-header-accent)" }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <ClientesTabla
            clientes={clientes}
            onActualizado={upsertLocal}
          />
          {total > pageSize && (
            <Paginador
                page={page}
                totalPages={Math.ceil(total / pageSize)}
                total={total}
                pageSize={pageSize}
                onPageChange={cambiarPagina}
                onPageSizeChange={( ) => {
                // El hook actual tiene pageSize fijo en 10. Por ahora ignoramos el cambio de pageSize desde el paginador 
                // porque el hook no lo expone. En el siguiente turno cuando refactoricemos el hook
                // para soportarlo lo conectamos. Por ahora el selector de cantidad queda visible pero sin efecto real.
                }}
            />
          )}
        </>
      )}
    </div>
  );
}

interface TarjetaConteoProps {
  titulo: string;
  // null significa que todavia esta cargando o fallo.
  valor: number | null;
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
        {valor === null ? "—" : valor}
      </p>
    </div>
  );
}