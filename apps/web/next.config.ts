import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    serverUrl: process.env.SERVER_URL,
    publicServerUrl: process.env.NEXT_PUBLIC_SERVER_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
