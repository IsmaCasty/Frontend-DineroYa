// Muestra un JSON formateado con indentacion legible. Usa <pre> para
// preservar el formato. Si el string no es JSON valido, muestra el raw.
interface JsonPreviewProps {
    // String JSON crudo que viene del backend (campo datosAnteriores o datosNuevos).
    // Puede ser null cuando el registro no tiene datos asociados.
    raw: string | null;
    // Etiqueta a mostrar arriba del bloque (ej: "Datos anteriores").
    label: string;
}

export function JsonPreview({ raw, label }: JsonPreviewProps) {
    if (!raw) {
        return (
            <div className="text-xs italic text-muted-foreground">
                Sin {label.toLowerCase()}
            </div>
        );
    }

    // Intentar parsear y formatear bonito. Si falla, mostrar el string crudo.
    let formateado: string;
    try {
        const parseado: unknown = JSON.parse(raw);
        formateado = JSON.stringify(parseado, null, 2);
    } catch {
        formateado = raw;
    }

    return (
        <div>
            <p
                className="mb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-muted-foreground)" }}
            >
                {label}
            </p>
            <pre
                className="max-h-64 overflow-auto rounded-md border p-3 text-xs"
                style={{
                    backgroundColor: "var(--color-muted)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-foreground)",
                    fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                }}
            >
                {formateado}
            </pre>
        </div>
    );
}