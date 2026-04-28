// Utilidad cn() para combinar clases de Tailwind sin conflictos.
// Requerida por los componentes de UI (shadcn/ui pattern).

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // Combina las clases usando clsx y luego resuelve los conflictos con twMerge.
}