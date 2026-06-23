// Wizard de creacion de contrato (RF-21, RF-22, RF-23, RF-25).
// Tres pasos en una sola pagina: 1) seleccion de cliente, 2) registro
// de joyas, 3) configuracion del prestamo y confirmacion.
// Un solo useForm cubre los pasos 2 y 3. El paso 1 es state simple.
// La validacion es parcial por paso: trigger("joyas") en paso 2,
// handleSubmit completo al confirmar en paso 3.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { ClientOnly } from "@/components/ui/client-only";
import { BuscadorCliente } from "@/components/contratos/nuevo/buscador-cliente";
import { PasoJoyas } from "@/components/contratos/nuevo/paso-joyas";
import { PasoPrestamo } from "@/components/contratos/nuevo/paso-prestamo";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useToast } from "@/lib/toast/use-toast";
import { useKilates } from "@/lib/hooks/use-kilates";
import { useTiposJoya } from "@/lib/hooks/use-tipos-joya";

import {
  contratoFormSchema,
  type ContratoFormValues,
} from "@/lib/validators/contrato.schema";
import type { ClienteListItem } from "@/lib/api/types/cliente.types";
import type {
  ContratoDetalle,
  CrearContratoInput,
} from "@/lib/api/types/contrato.types";

// Etiquetas del stepper visual
const PASOS = ["Cliente", "Joyas", "Prestamo"];

export default function NuevoContratoPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Catalogo de kilates y tipos de joya para los selects del paso 2
  const { kilates } = useKilates();
  const { tipos } = useTiposJoya();

  // Paso actual del wizard: 1, 2 o 3
  const [paso, setPaso] = useState(1);

  // Cliente seleccionado en el paso 1: fuera del form porque es una entidad
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteListItem | null>(null);

  // Estado del submit final
  const [submitting, setSubmitting] = useState(false);

 const {
  control,
  register,
  handleSubmit,
  trigger,
  formState: { errors },
} = useForm<ContratoFormValues>({
  // Cast explicito: zodResolver infiere el tipo de input del schema
  // (que puede diferir del output cuando hay refine o transformaciones),
  // pero nosotros usamos el tipo explicito ContratoFormValues como fuente de verdad para todo el formulario.
  resolver: zodResolver(contratoFormSchema) as Resolver<ContratoFormValues>,
  defaultValues: {
    joyas: [
      {
        idTipoJoya: 0,
        idKilate: 0,
        pesoBruto: 0,
        pesoNeto: 0,
        observaciones: "",
        valorTasacion: undefined,
      },
    ],
    montoSolicitado: 0,
    idMoneda: 1,
    // diasPlazo aqui porque lo quitamos del .default() del schema
    diasPlazo: 30,
    nroFolio: "",
    observacionesContrato: "",
  },
});

  // Navegacion hacia adelante con validacion parcial por paso
  const irAlSiguientePaso = async () => {
    if (paso === 1) {
      if (!clienteSeleccionado) {
        showToast("Selecciona un cliente para continuar", "error");
        return;
      }
      setPaso(2);
      return;
    }

    if (paso === 2) {
      // trigger solo valida el campo "joyas", no el formulario entero
      const esValido = await trigger("joyas");
      if (esValido) setPaso(3);
      return;
    }
  };

  const irAlPasoAnterior = () => {
    if (paso > 1) setPaso(paso - 1);
  };

  // Submit final: valida todo el formulario y crea el contrato
  const onSubmit = async (values: ContratoFormValues) => {
    if (!clienteSeleccionado) {
      showToast("No hay cliente seleccionado", "error");
      return;
    }

    // setState en el handler del submit (evento de usuario): correcto
    setSubmitting(true);

    const payload: CrearContratoInput = {
      idCliente: clienteSeleccionado.id,
      joyas: values.joyas.map((j) => ({
        idTipoJoya: Number(j.idTipoJoya),
        idKilate: Number(j.idKilate),
        pesoBruto: Number(j.pesoBruto),
        pesoNeto: Number(j.pesoNeto),
        observaciones: j.observaciones || undefined,
        valorTasacion: j.valorTasacion ? Number(j.valorTasacion) : undefined,
      })),
      montoSolicitado: Number(values.montoSolicitado),
      idMoneda: Number(values.idMoneda),
      nroFolio: values.nroFolio?.trim() || undefined,
      diasPlazo: Number(values.diasPlazo),
      observaciones: values.observacionesContrato?.trim() || undefined,
    };

    // Tipo intermedio: evita ambiguedad del parser JSX con genericos en .tsx
    type ContratoResp = ContratoDetalle;
    apiRequest<ContratoResp>(ENDPOINTS.contratos.crear, {
    method: "POST",
    body: payload,  // objeto directo
    })
      .then((contrato) => {
        showToast(
          `Contrato ${contrato.nroContrato} creado correctamente`,
          "success"
        );
        router.push(`/admin/contratos/${contrato.id}`);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Error al crear el contrato";
        showToast(msg, "error");
        setSubmitting(false);
      });
  };

  return (
    <ClientOnly>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header de la pagina */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/contratos")}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Crear Nuevo Contrato
            </h1>
            <p className="text-sm text-muted-foreground">
              Registra el préstamo y las joyas en garantia en estos 3 pasos
            </p>
          </div>
        </div>

        {/* Stepper visual */}
        <div className="flex items-center">
          {PASOS.map((label, i) => {
            const numero = i + 1;
            const activo = numero === paso;
            const completado = numero < paso;
            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: activo || completado ? "#1a3a1a" : undefined,
                      color: activo || completado ? "#c9a227" : undefined,
                      border: activo || completado ? "none" : "2px solid",
                      borderColor:
                        activo || completado ? "transparent" : "var(--border)",
                    }}
                  >
                    {numero}
                  </div>
                  <span
                    className="mt-1 text-xs font-medium"
                    style={{ color: activo ? "#c9a227" : undefined }}
                  >
                    {label}
                  </span>
                </div>
                {/* Linea conectora entre pasos */}
                {i < PASOS.length - 1 && (
                  <div
                    className="mx-2 h-px flex-1 transition-colors"
                    style={{
                      backgroundColor:
                        numero < paso ? "#1a3a1a" : "var(--border)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenido del paso actual */}
        <div className="rounded-lg border border-border bg-card p-6">
          {paso === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Primer Paso: Selecciona el Cliente
                </h3>
                <p className="text-xs text-muted-foreground">
                  Busca al cliente por CI, Nombre o Apellido
                </p>
              </div>
              <BuscadorCliente
                clienteSeleccionado={clienteSeleccionado}
                onClienteSeleccionado={setClienteSeleccionado}
                onLimpiar={() => setClienteSeleccionado(null)}
              />
              {!clienteSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  Si el cliente NO existe, entonces {" "}
                  <button
                    type="button"
                    onClick={() => router.push("/admin/clientes/nuevo")}
                    className="font-medium underline underline-offset-2"
                    style={{ color: "#c9a227" }}
                  >
                    Registralo Primero(Presiona Aqui)
                  </button>{" "}
                  y luego vuelve a Crear el Contrato.
                </p>
              )}
            </div>
          )}

            {paso === 2 && (
            <PasoJoyas
                control={control}
                register={register}
                errors={errors}
                kilates={kilates}
                tiposJoya={tipos}
            />
            )}

            {paso === 3 && (
            <PasoPrestamo
                control={control}
                register={register}
                errors={errors}
                kilates={kilates}
            />
            )}
        </div>

        {/* Barra de navegacion */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={irAlPasoAnterior}
            disabled={paso === 1}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Atras
          </button>

          {paso < 3 ? (
            <button
              type="button"
              onClick={irAlSiguientePaso}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-header-accent)" }}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#c9a227" }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitting ? "Creando contrato..." : "Confirmar y Crear Contrato"}
            </button>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}