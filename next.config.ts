import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    port: `${process.env.PORT ?? '3000'}`,
    kvRestApiUrl: `${process.env.KV_REST_API_URL}`,
    kvRestApiToken: `${process.env.KV_REST_API_TOKEN}`,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'fakeimg.pl',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
