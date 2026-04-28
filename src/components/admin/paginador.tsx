// Componente reutilizable de paginacion server-side.
// Muestra: pagina actual / total, selector de pageSize, botones anterior/siguiente.
"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginadorProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

const OPCIONES_PAGE_SIZE = [10, 25, 50, 100];

export function Paginador({
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: PaginadorProps) {
    const puedeAnterior = page > 1;
    const puedeSiguiente = page < totalPages;

    // Rango de items visibles en la pagina actual: "del 21 al 40 de 350".
    const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const hasta = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-3 text-card-foreground sm:flex-row">
            {/* Info de rango y total */}
            <div className="text-xs text-muted-foreground">
                {total === 0 ? (
                    <span>Sin registros</span>
                ) : (
                    <span>
                        Mostrando <strong>{desde}</strong> a <strong>{hasta}</strong> de{" "}
                        <strong>{total}</strong> registros
                    </span>
                )}
            </div>

            {/* Selector de pageSize y controles de pagina */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="pageSize" className="text-muted-foreground">
                        Cantidad por página:
                    </label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1"
                        style={{
                            backgroundColor: "var(--color-background)",
                            borderColor: "var(--color-input)",
                            color: "var(--color-foreground)",
                        }}
                    >
                        {OPCIONES_PAGE_SIZE.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onPageChange(page - 1)}
                        disabled={!puedeAnterior}
                        aria-label="Pagina anterior"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            borderColor: "var(--color-input)",
                            color: "var(--color-foreground)",
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="px-2 text-xs">
                        <strong>{page}</strong> de {totalPages || 1}
                    </span>

                    <button
                        type="button"
                        onClick={() => onPageChange(page + 1)}
                        disabled={!puedeSiguiente}
                        aria-label="Pagina siguiente"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            borderColor: "var(--color-input)",
                            color: "var(--color-foreground)",
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}