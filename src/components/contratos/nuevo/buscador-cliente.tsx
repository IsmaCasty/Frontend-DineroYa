// Buscador de cliente para el paso 1 del wizard de nuevo contrato.
// El input aplica debounce de 300ms. La carga y el setState ocurren
// dentro de handlers y callbacks async, nunca en el cuerpo de useEffect.
// Muestra un dropdown con resultados y una tarjeta del cliente seleccionado.
"use client";
import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X, User, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { formatearFechaBolivia } from "@/lib/utils/fecha-bolivia";
import { useToast } from "@/lib/toast/use-toast";
import type { ClienteListItem } from "@/lib/api/types/cliente.types";
import type { ClientesPaginadosResponse } from "@/lib/api/types/cliente.types";

interface BuscadorClienteProps {
  // Callback cuando el usuario selecciona un cliente del dropdown
  onClienteSeleccionado: (cliente: ClienteListItem) => void;
  // Callback cuando el usuario limpia la seleccion
  onLimpiar: () => void;
  // Cliente actualmente seleccionado (para mostrar la tarjeta)
  clienteSeleccionado: ClienteListItem | null;
}

export function BuscadorCliente({
  onClienteSeleccionado,
  onLimpiar,
  clienteSeleccionado,
}: BuscadorClienteProps) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ClienteListItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer click fuera del componente
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

    const buscarClientes = (q: string) => {
    setBuscando(true);

    type Resp = ClientesPaginadosResponse;
    apiRequest<Resp>(
        // Quitamos &limite=6: el backend de clientes no acepta ese param.
        // El backend devuelve su page size por defecto (suficiente para el dropdown).
        `${ENDPOINTS.clientes.lista}?q=${encodeURIComponent(q)}`
    )
        .then((data) => {
        const lista: ClienteListItem[] = Array.isArray(data)
            ? (data as unknown as ClienteListItem[])
            : (data.data ?? []);
        setResultados(lista);
        setMostrarDropdown(true);
        })
        .catch((err: unknown) => {
        const msg =
            err instanceof Error ? err.message : "Error al buscar clientes";
        showToast(msg, "error");
        setResultados([]);
        setMostrarDropdown(false);
        })
        .finally(() => {
        setBuscando(false);
        });
    };

  const handleQueryChange = (valor: string) => {
    // setState de un input (evento de usuario): siempre correcto
    setQuery(valor);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!valor.trim()) {
      setResultados([]);
      setMostrarDropdown(false);
      return;
    }

    // setBuscando aqui es un setState en un event handler: correcto
    setBuscando(true);
    debounceRef.current = setTimeout(() => buscarClientes(valor), 300);
  };

  const seleccionarCliente = (cliente: ClienteListItem) => {
    onClienteSeleccionado(cliente);
    setQuery("");
    setResultados([]);
    setMostrarDropdown(false);
  };

  // Si ya hay un cliente seleccionado, mostrar su tarjeta en lugar del buscador
  if (clienteSeleccionado) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-foreground">
                {clienteSeleccionado.nombreCompleto}
              </p>
              <p className="text-sm text-muted-foreground">
                CI: {clienteSeleccionado.ci}
                {clienteSeleccionado.telefono && (
                  <> &middot; Tel: {clienteSeleccionado.telefono}</>
                )}
              </p>
              {clienteSeleccionado.fechaCreacion && (
                <p className="text-xs text-muted-foreground">
                  Registrado el{" "}
                  {formatearFechaBolivia(clienteSeleccionado.fechaCreacion)}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onLimpiar}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cambiar cliente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={contenedorRef} className="relative">
        {/* El div con role combobox es el elemento que soporta aria-expandedmy aria-haspopup. El input dentro solo necesita aria-label. */}
        <div className="relative">
            {buscando ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Buscar por CI, nombre o apellido..."
                className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
                aria-label="Buscar cliente"
            />
        </div>

      {/* Dropdown de resultados */}
        {mostrarDropdown && resultados.length > 0 && (
        <div
            id="buscador-cliente-resultados"
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg"
            role="listbox"
            aria-label="Resultados de busqueda"
        >
            {resultados.map((cliente) => (
            <button
                key={cliente.id}
                type="button"
                onClick={() => seleccionarCliente(cliente)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                role="option"
                aria-selected={false}
            >
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                <p className="text-sm font-medium text-foreground">
                    {cliente.nombreCompleto}
                </p>
                <p className="text-xs text-muted-foreground">
                    CI: {cliente.ci}
                    {cliente.telefono && <> &middot; {cliente.telefono}</>}
                </p>
                </div>
            </button>
            ))}
        </div>
      )}

      {/* Sin resultados */}
      {mostrarDropdown && resultados.length === 0 && !buscando && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card px-4 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            No se encontro ningun cliente con ese criterio.
          </p>
        </div>
      )}
    </div>
  );
}