'use client';

import { useContext } from 'react';
import { AuthContext } from './auth-context';

// Hook para acceder al AuthContext.
// Lanza error si se usa fuera del AuthProvider (fail-fast en desarrollo).
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}