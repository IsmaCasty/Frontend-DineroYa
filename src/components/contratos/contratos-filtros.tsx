// Los inputs de texto aplican con debounce de 300ms (sin boton Buscar).
// Los selects y fechas aplican inmediatamente al cambiar.
// El estado local del componente es la fuente de verdad de los valores mostrados en los inputs;
// los filtros reales del hook se actualizan solo despues del debounce o al cambiar selects/fechas.
"use client";
import { useState, useRef, useEffect } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { FiltrosContrato } from "@/lib/hooks/use-contratos";
import type { ContratoEstado } from "@/lib/api/types/contrato.types";

interface ContratosFiltrosProps {
  onFiltrosChange: (filtros: FiltrosContrato) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

// Clases reutilizables para mantener consistencia con el resto del sistema
const inputClass =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const selectClass =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";

const ESTADOS: { value: ContratoEstado | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "VIGENTE", label: "Vigente" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ADJUDICADO", label: "Adjudicado" },
  { value: "DEVUELTO", label: "Devuelto" },
  { value: "ANULADO", label: "Anulado" },
];

export function ContratosFiltros({
  onFiltrosChange,
  onRefresh,
  isLoading,
}: ContratosFiltrosProps) {
  // Estado local de los inputs de texto para mostrar el valor mientras se escribe
  const [nroContrato, setNroContrato] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [estado, setEstado] = useState<ContratoEstado | "">("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Ref del timeout de debounce para cancelarlo si el usuario sigue escribiendo
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Construye y emite los filtros actuales.
  // Si busquedaCliente parece CI (solo digitos) lo manda como ci,
  // si contiene letras lo manda como nombreCliente.
  const emitirFiltros = (
    nro: string,
    cliente: string,
    est: ContratoEstado | "",
    desde: string,
    hasta: string
  ) => {
    const esCI = /^\d+$/.test(cliente.trim());
    onFiltrosChange({
      nroContrato: nro.trim() || undefined,
      ci: esCI && cliente.trim() ? cliente.trim() : undefined,
      nombreCliente: !esCI && cliente.trim() ? cliente.trim() : undefined,
      estado: est || undefined,
      fechaDesde: desde || undefined,
      fechaHasta: hasta || undefined,
    });
  };

  // Debounce para los inputs de texto: espera 300ms tras el ultimo keystroke
  const handleTextoChange = (
    valor: string,
    setter: (v: string) => void,
    campo: "nro" | "cliente"
  ) => {
    setter(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const nro = campo === "nro" ? valor : nroContrato;
      const cli = campo === "cliente" ? valor : busquedaCliente;
      emitirFiltros(nro, cli, estado, fechaDesde, fechaHasta);
    }, 300);
  };

  // Los selects y fechas aplican de inmediato sin debounce
  const handleEstadoChange = (valor: ContratoEstado | "") => {
    setEstado(valor);
    emitirFiltros(nroContrato, busquedaCliente, valor, fechaDesde, fechaHasta);
  };

  const handleFechaDesdeChange = (valor: string) => {
    setFechaDesde(valor);
    emitirFiltros(nroContrato, busquedaCliente, estado, valor, fechaHasta);
  };

  const handleFechaHastaChange = (valor: string) => {
    setFechaHasta(valor);
    emitirFiltros(nroContrato, busquedaCliente, estado, fechaDesde, valor);
  };

  // Limpiar el timeout al desmontar para no actualizar state en componente muerto
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      {/* Busqueda por numero de contrato */}
      <div className="relative min-w-45 flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="N° Contrato..."
          value={nroContrato}
          onChange={(e) => handleTextoChange(e.target.value, setNroContrato, "nro")}
          className={`${inputClass} pl-8 w-full`}
          aria-label="Buscar por Número de Contrato:"
        />
      </div>

      {/* Busqueda por CI o nombre del cliente */}
      <div className="relative min-w-45 flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="CI o Nombre del cliente..."
          value={busquedaCliente}
          onChange={(e) =>
            handleTextoChange(e.target.value, setBusquedaCliente, "cliente")
          }
          className={`${inputClass} pl-8 w-full`}
          aria-label="Buscar por CI o Nombre del cliente:"
        />
      </div>

      {/* Filtro de estado */}
      <select
        value={estado}
        onChange={(e) => handleEstadoChange(e.target.value as ContratoEstado | "")}
        className={selectClass}
        aria-label="Filtrar por Estado"
      >
        {ESTADOS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Rango de fechas de desembolso */}
      <input
        type="date"
        value={fechaDesde}
        onChange={(e) => handleFechaDesdeChange(e.target.value)}
        className={selectClass}
        aria-label="Fecha Desde:"
        title="Fecha de desembolso desde"
      />
      <input
        type="date"
        value={fechaHasta}
        onChange={(e) => handleFechaHastaChange(e.target.value)}
        className={selectClass}
        aria-label="Fecha Hasta:"
        title="Fecha de desembolso hasta"
      />

      {/* Boton de refresco manual */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        aria-label="Recargar listado"
        title="Recargar"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}