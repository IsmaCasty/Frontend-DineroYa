// Pagina de alta de cliente. Maneja el submit, el 409 CLIENTE_DUPLICADO con el modal dedicado, y navega al detalle del cliente creado al exito.
// El formulario en si vive en ClienteForm que es reutilizable para edicion.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { ClienteDuplicadoModal } from "@/components/clientes/cliente-duplicado-modal";
import { apiRequest, ApiError, esErrorClienteDuplicado } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import type { ClienteFormData } from "@/lib/validators/cliente.schema";
import type { ClienteDetalle } from "@/lib/api/types/cliente.types";

export default function NuevoClientePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Estado del modal de duplicado. Si tiene valor, el modal esta abierto con los datos del cliente existente.
  const [clienteDuplicado, setClienteDuplicado] =
    useState<ClienteDetalle | null>(null);

  const handleSubmit = async (data: ClienteFormData) => {
    try {
      // Construimos el payload limpiando strings vacios a null.
      // El backend acepta null para campos opcionales pero no string vacio.
      const payload = {
        ci: data.ci.trim(),
        tipoDocumento: data.tipoDocumento,
        paterno: data.paterno?.trim() || null,
        materno: data.materno?.trim() || null,
        nombre: data.nombre.trim(),
        apellidoCasado: data.apellidoCasado?.trim() || null,
        genero: data.genero || null,
        nacionalidad: data.nacionalidad?.trim() || null,
        fechaNacimiento: data.fechaNacimiento || null,
        nit: data.nit?.trim() || null,
        telefono: data.telefono?.trim() || null,
        direccion: data.direccion?.trim() || null,
        idZona: data.idZona || null,
      };

      const creado = await apiRequest<ClienteDetalle>(
        ENDPOINTS.clientes.base,
        { method: "POST", body: payload },
      );

      showToast(
        `Cliente ${creado.nombreCompleto} registrado correctamente.`,
        "success",
      );
      // Navegamos al detalle del cliente recien creado.
      router.push(`/admin/clientes/${creado.id}`);
    } catch (err) {
      if (esErrorClienteDuplicado(err)) {
        // 409 CLIENTE_DUPLICADO: mostramos el modal con el cliente existente.
        // No mostramos toast porque el modal ya da el feedback visual completo.
        setClienteDuplicado(err.raw.clienteExistente);
      } else if (err instanceof ApiError) {
        showToast(err.messages[0] ?? "No se pudo registrar el cliente.", "error");
      } else {
        showToast("Error de red al registrar el cliente.", "error");
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header con breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/clientes")}
          className="p-2 rounded-md hover:bg-secondary transition-colors"
          aria-label="Volver al listado"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar nuevo cliente</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Completa los datos para registrar un nuevo cliente
          </p>
        </div>
      </div>

      <ClienteForm
        labelSubmit="Registrar Cliente"
        onSubmit={async (data) => handleSubmit(data)}
        onCancelar={() => router.push("/admin/clientes")}
      />

      <ClienteDuplicadoModal
        open={!!clienteDuplicado}
        onOpenChange={(o) => { if (!o) setClienteDuplicado(null); }}
        clienteExistente={clienteDuplicado}
      />
    </div>
  );
}