/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    serverUrl: `${process.env.SERVER_URL}`,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
