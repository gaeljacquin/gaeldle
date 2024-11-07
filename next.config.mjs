/** @type {import('next').NextConfig} */
import vercelToolbar from '@vercel/toolbar/plugins/next';

const nextConfig = {
  env: {
    port: `${process.env.PORT ?? '3000'}`,
    kvUrl: `${process.env.KV_URL}`,
    kvRestApiUrl: `${process.env.KV_REST_API_URL}`,
    kvRestApiToken: `${process.env.KV_REST_API_TOKEN}`,
    kvRestApiReadOnlyToken: `${process.env.KV_REST_API_READ_ONLY_TOKEN}`,
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
