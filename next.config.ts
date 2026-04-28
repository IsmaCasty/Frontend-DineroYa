import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // standalone para producción con Docker (reduce imagen de ~1GB a ~100MB)
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
    ],
  },
};

export default nextConfig;