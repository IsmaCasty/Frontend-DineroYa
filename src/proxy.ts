// Proxy de Next.js 16 (antes llamado middleware).
// Se ejecuta ANTES de que se renderice cada ruta. Corre en el edge,
// no tiene acceso a localStorage (solo a cookies y headers).
// El auth-context.tsx setea una cookie 'dy_session' al login para que
// este proxy pueda saber si hay sesion activa.

import { NextRequest, NextResponse } from 'next/server';

// Rutas publicas que no requieren sesion.
const RUTAS_PUBLICAS = ['/login'];

// Rutas que solo ven los NO autenticados.
// Si ya hay sesion, redirigimos al dashboard.
const RUTAS_SOLO_NO_AUTENTICADOS = ['/login'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Recursos estaticos no se tocan
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const haySession = req.cookies.get('dy_session')?.value === 'active';

  const esRutaPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  const esSoloNoAuth = RUTAS_SOLO_NO_AUTENTICADOS.some((r) =>
    pathname.startsWith(r),
  );

  // Usuario NO autenticado intenta acceder a ruta protegida
  if (!haySession && !esRutaPublica) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Usuario autenticado intenta acceder al login
  if (haySession && esSoloNoAuth) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Aplicar el proxy a todas las rutas excepto las estaticas.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};