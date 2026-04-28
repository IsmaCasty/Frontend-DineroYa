// Hook que detecta si el viewport actual es mobile (< 768px).
// Implementacion con useSyncExternalStore
//   1. subscribe(callback): se ejecuta una vez, registra un listener en la fuente externa. 
//      Cuando la fuente cambia, llama al callback y React vuelve a leer el snapshot.
//   2. getSnapshot(): retorna el valor actual. Debe ser sincronico y consistente entre llamadas si nada cambio.
//   3. getServerSnapshot(): retorna el valor durante SSR (cuando no hay window). Aqui devolvemos false (no-mobile) como default seguro.
"use client";
import { useSyncExternalStore } from "react";

// Breakpoint md de Tailwind por default. Si lo cambias en config actualiza tambien este valor para mantener consistencia.
const MOBILE_BREAKPOINT = 768;
// Query CSS que matchea cuando el ancho es menor al breakpoint mobile.
// Se construye una sola vez fuera del hook para evitar recrear el string.
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// Subscribe: registra un listener en matchMedia y devuelve cleanup.
// React llama esta funcion una vez por mount y la mantiene viva mientras el componente este montado.
// El callback es la "señal" para React de que el snapshot pudo haber cambiado y debe volver a leerlo.
function subscribe(callback: () => void): () => void {
  // Guard SSR: si no hay window, no hay nada a que suscribirse.
  // Devolvemos cleanup vacio que React puede llamar sin problema.
  if (typeof window === "undefined") {
    return () => {};
  }
  const mq = window.matchMedia(MEDIA_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

// getSnapshot: lee el valor actual del media query. React la llama despues de cada render y compara con el valor anterior;
// si cambio, dispara un re-render con el valor nuevo.
function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MEDIA_QUERY).matches;
}

// getServerSnapshot: valor durante SSR. Asumimos no-mobile como default
// porque la mayoria del contenido se renderiza para desktop primero, y la hidratacion en cliente corregira el valor real apenas haya window.
function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}