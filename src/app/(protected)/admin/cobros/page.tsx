// frontend/src/app/(protected)/admin/cobros/page.tsx
// Pantalla de registro de cobros/pagos (RF-31, RF-32, RF-33).
// Flujo: buscar contrato → ver resumen → registrar pago (Turno 5).
// Este archivo gestiona el estado general de la pantalla.
'use client';
import { useState, useCallback } from 'react';
import { ArrowLeft, Coins, } from 'lucide-react';
import { apiRequest } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useToast } from '@/lib/toast/use-toast';
import { BuscarContrato } from '@/components/cobros/buscar-contrato';
import { FormularioPago } from '@/components/cobros/formulario-pago';
import Link from 'next/link';
import { History } from 'lucide-react';
import { FichaRapidaPago } from '@/components/cobros/ficha-rapida-pago';
import type { ContratoParaPago } from '@/lib/api/types/pago.types';

export default function CobrosPage() {
  const { showToast } = useToast();

  // null = ningún contrato seleccionado (mostramos búsqueda)
  const [contratoSeleccionado, setContratoSeleccionado] =
    useState<ContratoParaPago | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Al seleccionar un contrato de los resultados de búsqueda,
  // cargamos el detalle completo (incluye joyas, tasas, etc.)
  const handleSeleccionarContrato = useCallback(
    async (idContrato: number) => {
      setCargandoDetalle(true);
      try {
        type Resp = ContratoParaPago;
        const detalle = await apiRequest<Resp>(
          ENDPOINTS.contratos.porId(idContrato),
        );
        setContratoSeleccionado(detalle);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : 'No se pudo cargar el contrato.',
          'error',
        );
      } finally {
        setCargandoDetalle(false);
      }
    },
    [showToast],
  );

  const handleNuevaBusqueda = () => {
    setContratoSeleccionado(null);
  };

  return (
      <div className="flex flex-col gap-6 p-6">
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4">
              <div>
                  <h1 className="text-2xl font-bold text-foreground">
                      Registrar Pago y Cobro
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                      Busca el contrato y registra el Pago del Cliente
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  {/* Link al historial de cobros */}
                  <Link
                        href="/admin/cobros/historial"
                        className="inline-flex items-center text-foreground gap-2 rounded-md px-4 py-2 text-sm font-medium"
                        style={{
                            backgroundColor: "var(--color-header-accent)",
                        }}
                  >
                      <History className="h-4 w-4" />
                      Historial
                  </Link>
                  <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#1a3a1a' }}
                  >
                      <Coins className="h-5 w-5 text-white" />
                  </div>
              </div>
        </div>

      {/* PASO 1: Búsqueda (visible cuando no hay contrato seleccionado) */}
      {!contratoSeleccionado && (
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="mb-3 text-sm font-medium text-foreground">
              Buscar Contrato o Cliente
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Ingresa el número de contrato (ej:{' '}
              <span className="font-mono">DYLP2SM260004</span>) o el CI del
              cliente. Los resultados aparecen mientras escribes. Después seleccionalo...
            </p>

            {/* Input de búsqueda con debounce */}
            <BuscarContrato
              onSeleccionar={(id) => void handleSeleccionarContrato(id)}
              deshabilitado={cargandoDetalle}
            />

            {/* Loading mientras se carga el detalle */}
            {cargandoDetalle && (
              <p className="mt-3 text-sm text-muted-foreground">
                Cargando detalle del contrato...
              </p>
            )}
          </div>
        </div>
      )}

      {/* PASO 2: Contrato seleccionado (visible después de seleccionar) */}
      {contratoSeleccionado && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleNuevaBusqueda}
            className="flex w-fit items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Buscar otro Contrato
          </button>

          {/* Layout 2 columnas: ficha compacta (izq) + formulario de pago (der) */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Ficha rápida: siempre visible, sticky en desktop */}
            <FichaRapidaPago contrato={contratoSeleccionado} />

            {/* Formulario: cálculo, preview y confirmación */}
            <FormularioPago
              contrato={contratoSeleccionado}
              onPagoRegistrado={handleNuevaBusqueda}
            />
          </div>
        </div>
      )}
    </div>
  );
}