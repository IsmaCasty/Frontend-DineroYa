// Dashboard inicial. Solo usa user del contexto (no cargoActivo, que no existe).

"use client";

import { useAuth } from "@/lib/auth/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido al sistema, {user?.userName ?? "usuario"}.
        </p>
      </header>

      {/* Placeholder para los KPIs del Sprint 5 (RF-51) */}
      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-2 text-lg font-semibold">Sprint 1 en curso</h2>
        <p className="text-sm text-muted-foreground">
          Modulo de seguridad y autenticacion. Los KPIs del sistema se
          implementaran en el Sprint 5.
        </p>
      </section>
    </div>
  );
}