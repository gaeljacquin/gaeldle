import bundleAnalyzer from '@next/bundle-analyzer';
import vercelToolbar from '@vercel/toolbar/plugins/next';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default vercelToolbar()(
  withBundleAnalyzer({
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    experimental: {
      optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    },
    output: 'standalone',
  })
);
