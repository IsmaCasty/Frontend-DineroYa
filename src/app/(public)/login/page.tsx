// Pagina de login. Renderiza un card centrado con el logo, titulos y el
// formulario. El card usa --color-card para que se adapte al tema activo
// (blanco en modo claro, gris oscuro en modo oscuro), mientras que el fondo
// verde del layout permanece constante.

import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Iniciar sesion | Dinero Ya S.R.L.",
  description:
    "Ingrese al Sistema Web Integrado de gestion de contratos, cobros y registro de clientes de Dinero Ya S.R.L.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="relative overflow-hidden rounded-xl shadow-2xl"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-card-foreground)",
        }}
      >
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-dy-gold-600) 0%, var(--color-dy-gold-400) 50%, var(--color-dy-gold-600) 100%)",
          }}
        />

        <div className="px-8 py-10">
          <div className="mb-6 flex justify-center">
            <div
              className="rounded-full p-0.5"
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <Image
                src="/logo1.png"
                alt="Dinero Ya S.R.L."
                width={180}
                height={180}
                className="w-auto h-auto rounded-full"
                priority
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-primary)" }}
            >
              Bienvenido
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Suspense es obligatorio porque LoginForm usa useSearchParams().
              El fallback es minimo porque el formulario carga casi instantaneo. */}
          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <p
        className="mt-6 text-center text-xs"
        style={{ color: "rgba(255, 255, 255, 0.6)" }}
      >
        Sistema Web Integrado para la Gestión de Contratos, Cobros y Registro de Clientes
      </p>
    </div>
  );
}