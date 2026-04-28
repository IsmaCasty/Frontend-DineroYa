// Hook para consumir el ThemeContext.
// Lanza error si se usa fuera del ThemeProvider (mejor que devolver undefined silenciosamente).

'use client';

import { useContext } from 'react';
import { ThemeContext } from './theme-context';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
}