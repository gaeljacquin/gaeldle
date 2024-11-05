/** @type {import('next').NextConfig} */
import vercelToolbar from '@vercel/toolbar/plugins/next';

const nextConfig = {
  env: {
    serverUrl: `${process.env.SERVER_URL}`,
    upstashRedisRestUrl: `${process.env.UPSTASH_REDIS_REST_URL}`,
    upstashRedisRestToken: `${process.env.UPSTASH_REDIS_REST_TOKEN}`,
    smashQuizUrl: `${process.env.NEXT_PUBLIC_SMASH_QUIZ_URL}`,
    bearerToken: `${process.env.BEARER_TOKEN}`,
    port: `${process.env.PORT ?? '3000'}`,
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

export default vercelToolbar()(nextConfig);
