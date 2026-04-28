// Contexto global del tema claro/oscuro.
// Persiste la preferencia en localStorage bajo la clave 'dy_theme'.
// Aplica/remueve la clase .dark sobre el elemento <html>.
'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// Clave unica para localStorage (prefijo dy_ = dinero ya, evita colisiones)
const STORAGE_KEY = 'dy_theme';

// Lee el tema inicial de forma sincronica (sin useEffect).
// Prioridad: localStorage -> preferencia del sistema -> light.
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // Si nunca eligio nada, respeta la preferencia del sistema operativo
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Inicializacion lazy: solo se ejecuta una vez en el primer render
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Aplica la clase al <html> cada vez que cambia el tema.
  // Este useEffect es correcto porque sincroniza con el DOM externo (no inicializa state).
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage no disponible (navegacion privada extrema): ignorar
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}