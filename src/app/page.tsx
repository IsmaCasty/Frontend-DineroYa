// Ruta raiz: redirige segun si hay sesion o no.
// Como el middleware ya gestiona esto, solo redirigimos al dashboard.
// El middleware detectara si no hay sesion y redirigira a /login.

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}