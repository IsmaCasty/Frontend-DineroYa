// Pagina Mi Perfil. Muestra datos de cuenta y permite cambiar la contrasña.
"use client";
import { useAuth } from "@/lib/auth/use-auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function PerfilPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Datos de tu cuenta y cambio de contraseña
        </p>
      </header>

      {/* Card 1: datos de cuenta en modo lectura */}
      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-semibold">Datos de cuenta</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Nombre completo
            </dt>
            <dd className="mt-0.5 text-sm">{user?.nombreCompleto ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Usuario
            </dt>
            <dd className="mt-0.5 text-sm font-mono">
              {user?.userName ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">
              Cargo activo
            </dt>
            <dd className="mt-0.5 text-sm">
              {user?.cargoActivo.nombre ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Card 2: formulario de cambio de contrasenia */}
      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
          <p className="text-xs text-muted-foreground">
            Al cambiar tu contraseña, tendras que iniciar sesion nuevamente.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}