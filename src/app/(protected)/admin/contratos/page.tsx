// Listado principal de contratos (RF-28).
// Patron identico al de clientes y usuarios:
// header con boton de accion -> tarjetas de conteo -> filtros -> tabla -> paginador.
// ClientOnly obligatorio: el area autenticada usa Radix y tiene el bug
// de hidratacion conocido de React 19.2 + Next 16 que no tiene solucion oficial.

"use client";

import { useRouter } from "next/navigation";
import { FilePlus } from "lucide-react";
import { ClientOnly } from "@/components/ui/client-only";
import { Paginador } from "@/components/admin/paginador";
import { useContratos } from "@/lib/hooks/use-contratos";
import { ContratosFiltros } from "@/components/contratos/contratos-filtros";
import { ContratosTabla } from "@/components/contratos/contratos-tabla";

export default function ContratosPage() {
  const router = useRouter();
  const {
    contratos,
    total,
    totalVigentes,
    totalVencidos,
    page,
    pageSize,
    isLoading,
    error,
    cambiarPagina,
    aplicarFiltros,
    refetch,
  } = useContratos();

  const totalPaginas = Math.ceil(total / pageSize);

  return (
    <ClientOnly>
      <div className="space-y-6">
        {/* Header de la pantalla */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Contratos y Préstamos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los contratos de prestamo y las joyas en garantia
            </p>
          </div>

          {/* Boton de alta con color de marca hardcodeado */}
          <button
            onClick={() => router.push("/admin/contratos/nuevo")}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#c9a227" }}
          >
            <FilePlus className="h-4 w-4" />
            Nuevo Contrato
          </button>
        </div>

        {/* Tarjetas de conteo: resumen del estado de la cartera */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total de contratos en la busqueda actual */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Contratos:
            </p>
            <p className="mt-1 text-3xl font-bold text-foreground">{total}</p>
          </div>

          {/* Contratos vigentes: estado VIGENTE y sin mora */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contratos Vigentes:
            </p>
            <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
              {totalVigentes}
            </p>
          </div>

          {/* Contratos vencidos: estado VIGENTE pero con mora */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contratos En mora:
            </p>
            <p className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">
              {totalVencidos}
            </p>
          </div>
        </div>

        {/* Barra de filtros: debounce en texto, inmediato en selects y fechas */}
        <ContratosFiltros
          onFiltrosChange={aplicarFiltros}
          onRefresh={refetch}
          isLoading={isLoading}
        />

        {/* Mensaje de error si el backend falla */}
        {error && !isLoading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Tabla principal */}
        <ContratosTabla contratos={contratos} isLoading={isLoading} />

        {/* Paginador: props exactas del componente existente en el sistema */}
        {!isLoading && totalPaginas > 1 && (
        <Paginador
            page={page}
            totalPages={totalPaginas}
            total={total}
            pageSize={pageSize}
            onPageChange={cambiarPagina}
            onPageSizeChange={() => {
            // El hook tiene pageSize fijo en 20 por ahora.
            }}
        />
        )}
      </div>
    </ClientOnly>
  );
}