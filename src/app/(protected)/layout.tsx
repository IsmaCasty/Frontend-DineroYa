// Layout del area autenticada.
// IMPORTANTE: Todo el area protegida se renderiza SOLO en cliente.
// Razones:
//   1. La autenticacion se valida con localStorage (useAuth), que no
//      existe en SSR. El render del servidor siempre seria "no autenticado".
//   2. Radix UI con React 19.2 + Next 16 tiene un bug conocido de useId
//      que genera IDs distintos entre servidor y cliente, causando
//      hydration mismatch (script id="_R_"). Bug oficial:
//      https://github.com/radix-ui/primitives/issues/3700
//   3. El SSR de paginas que requieren auth no tiene beneficio de SEO.
//
// La solucion es envolver TODO el contenido en ClientOnly. Durante SSR
// se renderiza un placeholder de carga, y al hidratar aparece el layout
// real. El usuario ve un loader brevisimo y despues la app.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBackdrop } from "@/components/layout/mobile-backdrop";
import { SidebarProvider } from "@/lib/sidebar/sidebar-context";
import { ToastProvider } from "@/lib/toast/toast-context";
import { ClientOnly } from "@/components/ui/client-only";
import { useAuth } from "@/lib/auth/use-auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly fallback={<PantallaCargando />}>
      <ContenidoProtegido>{children}</ContenidoProtegido>
    </ClientOnly>
  );
}

// Pantalla de carga mientras hidratamos. Mismo background que el layout real
// para que la transicion sea imperceptible.
function PantallaCargando() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ color: "var(--color-muted-foreground)" }}
        aria-label="Cargando"
      />
    </div>
  );
}

// Contenido real del layout. Solo se monta despues de hidratar, por lo
// que tiene acceso seguro a useAuth, useRouter y useSidebar sin riesgo
// de mismatch entre servidor y cliente.
function ContenidoProtegido({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redireccion defensiva si no hay sesion. El middleware (proxy.ts)
  // tambien protege a nivel servidor.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <PantallaCargando />;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar />
          <MobileBackdrop />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-x-hidden">
              <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </SidebarProvider>
  );
}