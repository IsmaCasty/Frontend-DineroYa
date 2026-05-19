import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // standalone es solo para Docker. Vercel no lo necesita y puede romperse con él.
  // images: solo necesitas patrones para dominios externos en next/image.
  // Si no usas next/image con imágenes del backend, este bloque no es necesario.
  // Lo dejamos apuntando al backend de producción por si acaso.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend-dineroya.onrender.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;