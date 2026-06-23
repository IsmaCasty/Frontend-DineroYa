// Layout raiz. Usa el componente Script de Next.js con strategy="beforeInteractive"
// en lugar de <script dangerouslySetInnerHTML> para evitar la advertencia
// de Next 16 y garantizar que el script se ejecute antes de la hidratacion.
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Dinero Ya S.R.L. | Sistema de Gestión',
  description:
    'Sistema Web Integrado para la Gestión de Contratos, Cobros y Registro de Clientes',
};
// Script anti-parpadeo del modo oscuro. Lee localStorage y aplica la clase
// .dark al <html> ANTES de que React hidrate, para que el usuario no vea
// el flash de fondo blanco si tiene tema oscuro guardado.
const scriptAntiParpadeo = `
(function() {
  try {
    var guardado = window.localStorage.getItem('dy-theme');
    var usarOscuro = guardado === 'dark' ||
      (!guardado && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (usarOscuro) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {/* Script de Next.js con strategy="beforeInteractive" se ejecuta
            antes de hidratar React, equivalente al <script> inline pero
            sin la advertencia de Next 16. id es obligatorio. */}
        <Script id="dy-theme-init" strategy="beforeInteractive">
          {scriptAntiParpadeo}
        </Script>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}