// Formulario de login con soporte multi-cargo.
// Si el backend responde requiresCargoSelection, mostramos el selecto y reenviamos el login incluyendo el idCargo elegido.

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; // Iconos para mostrar/ocultar contrasenia.

import { loginSchema, type LoginInput } from '@/lib/validators/login.schema';
import { useAuth } from '@/lib/auth/use-auth';

interface CargoDisponible {
  id: number;
  nombre: string;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Si el middleware redirigio aqui con ?next=/algo, volvemos a esa ruta tras el login
  const nextUrl = searchParams.get('next') ?? '/dashboard';

  const [apiError, setApiError] = useState<string | null>(null);
  const [cargosDisponibles, setCargosDisponibles] = useState<CargoDisponible[] | null>(null);
  const [cargoSeleccionado, setCargoSeleccionado] = useState<number | null>(null);
  // Estado del toggle de visibilidad de la contraseña.
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setApiError(null);
    try {
      // Si estamos en segundo paso (elegir cargo), usamos el cargo seleccionado
      const idCargo = cargosDisponibles && cargoSeleccionado ? cargoSeleccionado : undefined;
      const result = await login(data.userName, data.password, idCargo);

      if (result.ok) {
        router.push(nextUrl);
        return;
      }

      // Backend pide elegir cargo (usuario tiene mas de uno)
      if (result.requiresCargoSelection) {
        setCargosDisponibles(result.cargosDisponibles);
        setCargoSeleccionado(result.cargosDisponibles[0]?.id ?? null);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  // Accion del segundo paso: reenvia el mismo login con idCargo
  async function handleCargoSubmit() {
    const { userName, password } = getValues();
    await onSubmit({ userName, password });
  }

  // Clases reutilizables para inputs (respetan el tema)
  const inputClasses =
    'w-full px-3 py-2 rounded-md bg-surface text-foreground ' +
    'border border-input focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 ' +
    'outline-none transition-colors placeholder:text-muted-foreground';

  const labelClasses = 'block text-sm font-medium text-foreground mb-1';

  // --- Vista 1: formulario inicial ---
  if (!cargosDisponibles) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="userName" className={labelClasses}>
            Usuario:
          </label>
          <input
            id="userName"
            type="text"
            autoComplete="username"
            autoFocus
            className={inputClasses}
            placeholder="Ingrese su usuario"
            {...register('userName')}
          />
          {errors.userName && (
            <p className="mt-1 text-xs text-danger-500">{errors.userName.message}</p>
          )}
        </div>
        
        {/* Campo de contrasenia con boton de ojito para mostrar/ocultar.
    El boton es absolute positioned dentro de un wrapper relative.
    aria-label cambia segun el estado para lectores de pantalla. */}
        <div>
          <label
            htmlFor="password"
            className={labelClasses}
            style={{ color: "var(--color-foreground)" }}
          >
            Contraseña:
          </label>

          {/* Wrapper relative para posicionar el boton del ojito */}
          <div className="relative mt-1">
            <input
              id="password"
              // El type alterna segun el state. Asi se "muestra" la contrasenia.
              type={mostrarPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isSubmitting}
              placeholder="Ingrese su contraseña"
              {...register("password")}
              // pr-10 deja espacio a la derecha para que el texto no choque con el icono
              className={inputClasses + " pr-10"}
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-input)",
                color: "var(--color-foreground)",
              }}
            />

            {/* Boton de ojito. tabIndex=-1 para que no entre en el orden de tab,
                asi el usuario al presionar Tab pasa directo al boton submit. */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setMostrarPassword((prev) => !prev)}
              aria-label={
                mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {mostrarPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {apiError && (
          <div className="rounded-md bg-danger-500/10 border border-danger-500/30 px-3 py-2">
            <p className="text-sm text-danger-500">{apiError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full py-2.5 rounded-md font-semibold
            text-foreground 
            transition-colors flex items-center justify-center gap-2
            disabled:cursor-not-allowed 
          "
          style={{
            backgroundColor: "var(--color-dy-gold-500)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-dy-gold-600)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-dy-gold-500)")
          }
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
        </button>
      </form>
    );
  }

  // --- Vista 2: seleccion de cargo (usuario con varios cargos activos) ---
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-accent-500/10 border border-accent-500/30 px-3 py-2">
        <p className="text-sm text-foreground">
          Tu cuenta tiene varios cargos activos. Elige con cual iniciar sesion:
        </p>
      </div>

      <div className="space-y-2">
        {cargosDisponibles.map((cargo) => (
          <label
            key={cargo.id}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors
              ${
                cargoSeleccionado === cargo.id
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-input hover:border-accent-500/50'
              }
            `}
          >
            <input
              type="radio"
              name="cargo"
              value={cargo.id}
              checked={cargoSeleccionado === cargo.id}
              onChange={() => setCargoSeleccionado(cargo.id)}
              className="accent-accent-500"
            />
            <span className="text-foreground font-medium">{cargo.nombre}</span>
          </label>
        ))}
      </div>

      {apiError && (
        <div className="rounded-md bg-danger-500/10 border border-danger-500/30 px-3 py-2">
          <p className="text-sm text-danger-500">{apiError}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setCargosDisponibles(null);
            setCargoSeleccionado(null);
            setApiError(null);
          }}
          className="
            flex-1 py-2.5 rounded-md font-semibold
            border border-input text-foreground
            hover:bg-muted
            transition-colors
          "
        >
          Atrás
        </button>

        <button
          type="button"
          onClick={handleCargoSubmit}
          disabled={!cargoSeleccionado || isSubmitting}
          className="
            flex-1 py-2.5 rounded-md font-semibold
          bg-dy-gold-500 text-foreground
          hover:bg-dy-gold-600
          disabled:bg-dy-gold-400 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-2
          "
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Continuar
        </button>
      </div>
    </div>
  );
}