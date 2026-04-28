// Badge que muestra una accion de auditoria con color segun su categoria.
// Las acciones de eliminacion/revocacion se ven distintas a las de creacion.
import { obtenerEtiquetaAccion } from "@/lib/admin/auditoria-acciones";
// Mapeo de prefijos de accion a colores de badge. Permite que acciones nuevas sin entrada explicita igual reciban un color razonable.
function obtenerColorPorAccion(accion: string): {
    bg: string;
    text: string;
} {
    if (accion.startsWith("CREAR") || accion === "LOGIN") {
        return { bg: "#dcfce7", text: "#166534" };
    }
    if (accion.startsWith("ACTUALIZAR") || accion === "REFRESH_TOKEN") {
        return { bg: "#dbeafe", text: "#1e40af" };
    }
    if (
        accion.startsWith("REVOCAR") ||
        accion === "LOGOUT" ||
        accion === "RESET_PASSWORD"
    ) {
        return { bg: "#fee2e2", text: "#991b1b" };
    }
    if (accion === "ASIGNAR_CARGO" || accion === "CAMBIAR_PASSWORD") {
        return { bg: "rgba(201, 162, 39, 0.15)", text: "#854d0e" };
    }
    // Default neutro.
    return { bg: "#f3f4f6", text: "#374151" };
}

interface AccionBadgeProps {
    accion: string;
}

export function AccionBadge({ accion }: AccionBadgeProps) {
    const colores = obtenerColorPorAccion(accion);
    const etiqueta = obtenerEtiquetaAccion(accion);

    return (
        <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
                backgroundColor: colores.bg,
                color: colores.text,
            }}
        >
            {etiqueta}
        </span>
    );
}