import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    apiUrl: process.env.SERVER_URL ?? 'http://localhost:8080',
    newApiUrl: process.env.NEW_API_URL ?? 'http://localhost:8081',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'gaeldle-image-gen.gaeljacquin.com',
        pathname: '**',
      },
    ],
  },
  allowedDevOrigins: ['dev-client.gaeljacquin.com'],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
