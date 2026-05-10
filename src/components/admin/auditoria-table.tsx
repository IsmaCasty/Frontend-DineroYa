// Tabla de auditoria con filas expandibles. Click en una fila muestra los
// datos anteriores/nuevos en formato JSON, mas el ipAddress
"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AccionBadge } from "@/components/admin/accion-badge";
import { JsonPreview } from "@/components/admin/json-preview";
import { formatearFechaHora } from "@/lib/utils/fecha";
import type { AuditoriaItem } from "@/lib/api/types/auditoria.types";

interface AuditoriaTableProps {
    items: AuditoriaItem[];
}

export function AuditoriaTable({ items }: AuditoriaTableProps) {
    // Set de ids de filas expandidas. Permite tener varias abiertas a la vez.
    const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

    const toggleExpandida = (id: number) => {
        setExpandidas((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (items.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center text-card-foreground">
                <p className="text-sm text-muted-foreground">
                    No se encontraron registros con los filtros aplicados.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border bg-card text-card-foreground">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left border-gray-200 text-white dark:border-gray-700" style={{ backgroundColor: '#1a3a1a' }}>
                        <th className="w-8 px-2 py-3" aria-label="Expandir" />
                        <th className="px-4 py-3 font-semibold">Fecha y Hora</th>
                        <th className="px-4 py-3 font-semibold">Usuario</th>
                        <th className="px-4 py-3 font-semibold">Accion</th>
                        <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                            Entidad
                        </th>
                        <th className="hidden px-4 py-3 font-semibold lg:table-cell">IP</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                        const expandida = expandidas.has(item.id);
                        return (
                            <FilaAuditoria
                                key={item.id}
                                item={item}
                                expandida={expandida}
                                onToggle={() => toggleExpandida(item.id)}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// Subcomponente: fila de auditoria con su panel expandible.
interface FilaAuditoriaProps {
    item: AuditoriaItem;
    expandida: boolean;
    onToggle: () => void;
}

function FilaAuditoria({ item, expandida, onToggle }: FilaAuditoriaProps) {
    return (
        <>
            <tr
                onClick={onToggle}
                className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                aria-expanded={expandida}
            >
                <td className="px-2 py-3 align-top">
                    <button
                        type="button"
                        aria-label={expandida ? "Contraer" : "Expandir"}
                        className="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-muted"
                    >
                        {expandida ? (
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                </td>
                <td className="px-4 py-3 text-sm"
                    style={{ color: "var(--color-muted-foreground)" }}>
                    {formatearFechaHora(item.fechaAccion)}
                </td>
                <td className="px-4 py-3 align-top">
                    {item.nombreCompleto ? (
                        <div>
                            <p className="font-medium">{item.nombreCompleto}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                                {item.userName}
                            </p>
                        </div>
                    ) : (
                        <span className="text-xs italic text-muted-foreground">
                            Sistema
                        </span>
                    )}
                </td>
                <td className="px-4 py-3 align-top">
                    <AccionBadge accion={item.accion} />
                </td>
                <td className="hidden px-4 py-3 align-top font-mono text-xs lg:table-cell">
                    {item.idEntidad ?? "—"}
                </td>
                <td className="hidden px-4 py-3 align-top font-mono text-xs text-muted-foreground lg:table-cell">
                    {item.ipAddress ?? "—"}
                </td>
            </tr>

            {/* Panel expandible con detalle. colSpan abarca todas las columnas. */}
            {expandida && (
                <tr style={{ backgroundColor: "var(--color-muted)" }}>
                    <td colSpan={6} className="px-4 py-4">
                        <div className="space-y-4">
                            {/* Info contextual visible siempre que hay expansion */}
                            <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                        ID registro:
                                    </p>
                                    <p className="font-mono">{item.id}</p>
                                </div>
                                <div>
                                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                        Cuenta:
                                    </p>
                                    <p className="font-mono">{item.idCuenta ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                        Entidad:
                                    </p>
                                    <p className="font-mono">{item.idEntidad ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                        IP:
                                    </p>
                                    <p className="font-mono">{item.ipAddress ?? "—"}</p>
                                </div>
                            </div>

                            {/* Datos anteriores y nuevos lado a lado en pantallas grandes */}
                            <div className="grid gap-3 lg:grid-cols-2">
                                <JsonPreview
                                    raw={item.datosAnteriores}
                                    label="Datos anteriores"
                                />
                                <JsonPreview raw={item.datosNuevos} label="Datos nuevos" />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}