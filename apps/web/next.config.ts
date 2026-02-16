import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    serverUrl: process.env.SERVER_URL,
    r2PublicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
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
        hostname: 'gaeldle-image-gen.gaeljacquin.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
