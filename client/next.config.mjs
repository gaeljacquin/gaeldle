/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    serverUrl: `${process.env.SERVER_URL}`,
    upstashRedisRestUrl: `${process.env.UPSTASH_REDIS_REST_URL}`,
    upstashRedisRestToken: `${process.env.UPSTASH_REDIS_REST_TOKEN}`,
    smashQuizUrl: `${process.env.NEXT_PUBLIC_SMASH_QUIZ_URL}`,
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
