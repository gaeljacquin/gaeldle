import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    serverUrl: process.env.SERVER_URL,
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
