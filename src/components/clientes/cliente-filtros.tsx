// busqueda libre (q), select de localidad y select de zona en cascada.
// El select de zona se deshabilita hasta que se elija una localidad.
// Al cambiar cualquier filtro se llama onFiltrar con el estado completo.
// No hay boton "buscar": filtramos al cambiar para UX mas fluida.
// Usamos debounce simple con setTimeout en el campo de texto para no disparar un request por cada tecla presionada.
"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLocalidades } from "@/lib/hooks/use-localidades";
import type { BuscarClientesFiltros } from "@/lib/api/types/cliente.types";

type FiltrosActivos = Omit<BuscarClientesFiltros, "page" | "pageSize">;

interface ClienteFiltrosProps {
  onFiltrar: (filtros: FiltrosActivos) => void;
}

export function ClienteFiltros({ onFiltrar }: ClienteFiltrosProps) {
  const { localidades, zonasPorLocalidad, isLoading: loadingGeo } = useLocalidades();

  const [q, setQ] = useState("");
  const [idLocalidad, setIdLocalidad] = useState<number | null>(null);
  const [idZona, setIdZona] = useState<number | null>(null);
  const [estado, setEstado] = useState<boolean | undefined>(undefined);

  // Zonas disponibles segun la localidad seleccionada.
  const zonas = zonasPorLocalidad(idLocalidad);

  // Debounce del campo de texto: esperamos 400ms sin escribir antes de filtrar.
  // Ref para el timer para poder cancelarlo si el usuario sigue escribiendo.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emitir filtros al padre. Lo llamamos cuando cambia cualquier control.
  // Para texto usamos debounce, para selects inmediato.
  const emitir = (
    nuevoQ: string,
    nuevoIdZona: number | null,
    nuevoEstado: boolean | undefined,
  ) => {
    const filtros: FiltrosActivos = {};
    if (nuevoQ.trim()) filtros.q = nuevoQ.trim();
    if (nuevoIdZona !== null) filtros.idZona = nuevoIdZona;
    if (nuevoEstado !== undefined) filtros.estado = nuevoEstado;
    onFiltrar(filtros);
  };

  const handleQ = (valor: string) => {
    setQ(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitir(valor, idZona, estado);
    }, 400);
  };

  const handleLocalidad = (valor: string) => {
    const id = valor === "" ? null : Number(valor);
    setIdLocalidad(id);
    // Al cambiar localidad, reseteamos zona porque las zonas anteriores ya no son validas para la nueva localidad seleccionada.
    setIdZona(null);
    emitir(q, null, estado);
  };

  const handleZona = (valor: string) => {
    const id = valor === "" ? null : Number(valor);
    setIdZona(id);
    emitir(q, id, estado);
  };

  const handleEstado = (valor: string) => {
    const nuevoEstado =
      valor === "true" ? true : valor === "false" ? false : undefined;
    setEstado(nuevoEstado);
    emitir(q, idZona, nuevoEstado);
  };

  // Cleanup del debounce al desmontar para no ejecutar setState sobre un componente desmontado.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const selectClass =
    "rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const selectStyle = { borderColor: "var(--color-border)" };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Busqueda libre: nombre, CI, telefono, NIT */}
      <div className="flex-1 min-w-65 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--color-muted-foreground)" }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Buscar por nombre, CI, telefono..."
          value={q}
          onChange={(e) => handleQ(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm"
          style={selectStyle}
          aria-label="Buscar Clientes"
        />
      </div>

      {/* Selector de localidad */}
      <select
        value={idLocalidad ?? ""}
        onChange={(e) => handleLocalidad(e.target.value)}
        disabled={loadingGeo}
        className={selectClass}
        style={selectStyle}
        aria-label="Filtrar por localidad"
      >
        <option value="">Todas las localidades</option>
        {localidades.filter((l) => l.estado).map((l) => (
          <option key={l.id} value={l.id}>
            {l.nombre}
          </option>
        ))}
      </select>

      {/* Selector de zona: deshabilitado si no hay localidad elegida */}
      <select
        value={idZona ?? ""}
        onChange={(e) => handleZona(e.target.value)}
        disabled={loadingGeo || idLocalidad === null}
        className={selectClass}
        style={selectStyle}
        aria-label="Filtrar por zona"
      >
        <option value="">
          {idLocalidad === null ? "Primero elige localidad" : "Todas las zonas"}
        </option>
        {zonas.map((z) => (
          <option key={z.id} value={z.id}>
            {z.nombre}
          </option>
        ))}
      </select>

      {/* Filtro de estado */}
      <select
        value={estado === undefined ? "" : String(estado)}
        onChange={(e) => handleEstado(e.target.value)}
        className={selectClass}
        style={selectStyle}
        aria-label="Filtrar por estado"
      >
        <option value="">Todos los estados</option>
        <option value="true">Solo activos</option>
        <option value="false">Solo inactivos</option>
      </select>
    </div>
  );
}