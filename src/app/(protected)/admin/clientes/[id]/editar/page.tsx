// Pagina de edicion de cliente. Precarga los datos del cliente desde el
// backend, construye los defaultValues para ClienteForm (incluyendo
// idLocalidad derivado de localidadNombre), y hace PATCH con diff payload:
// solo envia los campos que el usuario modifico (dirtyFields de RHF).
// Si el CI editado ya existe en otro cliente, muestra el modal de duplicado.
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { ClienteDuplicadoModal } from "@/components/clientes/cliente-duplicado-modal";
import { apiRequest, ApiError, esErrorClienteDuplicado } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import type { ClienteFormData } from "@/lib/validators/cliente.schema";
import type { ClienteDetalle } from "@/lib/api/types/cliente.types";

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();

  const id = Number(params.id);

  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clienteDuplicado, setClienteDuplicado] = useState<ClienteDetalle | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiRequest<ClienteDetalle>(
          ENDPOINTS.clientes.porId(id),
        );
        setCliente(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.messages[0] ?? "No se pudo cargar el cliente.");
        } else {
          setError("Error de red al cargar el cliente.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    void cargar();
  }, [id]);

  // Construye los defaultValues para el formulario a partir del cliente cargado.
  // El campo idLocalidad no viene directamente del backend (solo viene localidadNombre
  // y zonaNombre como strings denormalizados). Para precargarlo necesitamos buscarlo
  // en el hook de localidades. La solucion mas simple es pasarlo como NaN si no existe
  // y dejarlo en blanco: el usuario puede re-seleccionarlo si quiere cambiar la zona.
  // En Sprint 2 esto es aceptable. En el futuro el backend podria devolver idLocalidad.
    const buildDefaultValues = (c: ClienteDetalle): Partial<ClienteFormData> => ({
    tipoDocumento: (c.tipoDocumento as ClienteFormData["tipoDocumento"]) ?? "CI",
    ci: c.ci ?? "",
    paterno: c.paterno ?? "",
    materno: c.materno ?? "",
    nombre: c.nombre ?? "",
    apellidoCasado: c.apellidoCasado ?? "",
    genero: (c.genero as ClienteFormData["genero"]) ?? "",
    nacionalidad: c.nacionalidad ?? "",
    fechaNacimiento: c.fechaNacimiento
      ? c.fechaNacimiento.split("T")[0]
      : "",
    nit: c.nit ?? "",
    telefono: c.telefono ?? "",
    direccion: c.direccion ?? "",
    // Ahora idLocalidad viene del backend directamente. El selector de
    // localidad se precarga correctamente y las zonas se filtran solas.
    idLocalidad: c.idLocalidad ?? undefined,
    idZona: c.idZona ?? undefined,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Cargando datos del cliente...
        </p>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-card-foreground">
        <p className="text-sm" style={{ color: "#dc2626" }}>
          {error ?? "Cliente no encontrado."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/clientes")}
          className="mt-3 text-sm underline"
          style={{ color: "var(--color-header-accent)" }}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con navegacion */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push(`/admin/clientes/${id}`)}
          className="p-2 rounded-md hover:bg-secondary transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar cliente
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {cliente.nombreCompleto} - CI: {cliente.ci}
          </p>
        </div>
      </div>

      {/* Informacion de zona actual si la tiene, para que el usuario sepa
          que la localidad puede quedar en blanco al editar */}
      {cliente.zonaNombre && (
        <div
          className="rounded-md p-3 text-sm"
          style={{
            backgroundColor: "var(--color-background-secondary)",
            borderLeft: "3px solid var(--color-header-accent)",
          }}
        >
          <span style={{ color: "var(--color-muted-foreground)" }}>
            Zona Actual del Cliente:{" "}
          </span>
          <strong>
            {cliente.localidadNombre} - {cliente.zonaNombre}
          </strong>
          <span
            className="block mt-1 text-xs"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Para conservar la zona actual, no modifiques los selectores de
            Ubicacion. Para cambiarla, selecciona primero la localidad.
          </span>
        </div>
      )}

      <ClienteForm
        defaultValues={buildDefaultValues(cliente)}
        labelSubmit="Guardar cambios"
        onSubmit={async (data, dirtyFields) => {
            const payload: Record<string, unknown> = {};
            if (dirtyFields.ci) payload.ci = data.ci.trim();
            if (dirtyFields.tipoDocumento) payload.tipoDocumento = data.tipoDocumento;
            if (dirtyFields.paterno) payload.paterno = data.paterno?.trim() || null;
            if (dirtyFields.materno) payload.materno = data.materno?.trim() || null;
            if (dirtyFields.nombre) payload.nombre = data.nombre.trim();
            if (dirtyFields.apellidoCasado) payload.apellidoCasado = data.apellidoCasado?.trim() || null;
            if (dirtyFields.genero) payload.genero = data.genero || null;
            if (dirtyFields.nacionalidad) payload.nacionalidad = data.nacionalidad?.trim() || null;
            if (dirtyFields.fechaNacimiento) payload.fechaNacimiento = data.fechaNacimiento || null;
            if (dirtyFields.nit) payload.nit = data.nit?.trim() || null;
            if (dirtyFields.telefono) payload.telefono = data.telefono?.trim() || null;
            if (dirtyFields.direccion) payload.direccion = data.direccion?.trim() || null;
            if (dirtyFields.idZona) payload.idZona = data.idZona || null;

            if (Object.keys(payload).length === 0) {
            showToast("No hay cambios para guardar.", "info");
            return;
            }

            try {
            await apiRequest<ClienteDetalle>(
                ENDPOINTS.clientes.porId(id),
                { method: "PATCH", body: payload },
            );
            showToast("Cliente actualizado correctamente.", "success");
            router.push(`/admin/clientes/${id}`);
            } catch (err) {
            if (esErrorClienteDuplicado(err)) {
                setClienteDuplicado(err.raw.clienteExistente);
            } else if (err instanceof ApiError) {
                showToast(err.messages[0] ?? "No se pudo actualizar el cliente.", "error");
            } else {
                showToast("Error de red al actualizar el cliente.", "error");
            }
            }
        }}
        onCancelar={() => router.push(`/admin/clientes/${id}`)}
        />

      <ClienteDuplicadoModal
        open={!!clienteDuplicado}
        onOpenChange={(o) => { if (!o) setClienteDuplicado(null); }}
        clienteExistente={clienteDuplicado}
      />
    </div>
  );
}

