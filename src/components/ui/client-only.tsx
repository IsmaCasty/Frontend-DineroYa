// Renderiza children SOLO despues de que el componente hidrate en el cliente.
// Durante SSR y la primera hidratacion, renderiza null (o el fallback).
//
// Uso: envolver componentes que generan IDs aleatorios o consultan APIs
// del navegador (Radix UI con useId, librerias que usan window, etc.).
//
// Implementacion con useSyncExternalStore para evitar el patron
// useEffect + setState que React 19 marca como cascading render.
//
// Como funciona:
//   - getServerSnapshot devuelve false (no estamos en cliente).
//   - getSnapshot del cliente devuelve true (ya hidratamos).
//   - subscribe es no-op porque el valor nunca cambia post-hidratacion.
//
// Resultado: el primer render en cliente devuelve false (igual que SSR,
// sin mismatch). En el siguiente tick React detecta que getSnapshot
// devuelve true y re-renderiza con los children reales.
"use client";
import { useSyncExternalStore, type ReactNode } from "react";

// subscribe no-op: el valor nunca cambia despues de hidratar.
// Solo necesitamos que el snapshot del cliente difiera del server.
function subscribe(): () => void {
  return () => {};
}

// En el cliente, despues de la primera lectura, devolvemos true.
function getSnapshot(): boolean {
  return true;
}

// Durante SSR, devolvemos false para que el primer render en cliente
// tambien sea false (sin mismatch). Despues del primer render,
// useSyncExternalStore detecta el cambio y re-renderiza.
function getServerSnapshot(): boolean {
  return false;
}

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!isMounted) return <>{fallback}</>;
  return <>{children}</>;
}