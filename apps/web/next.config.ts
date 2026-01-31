import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
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
      {
        protocol: 'https',
        hostname: 'kqujhdaltqildqytisgc.supabase.co',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
