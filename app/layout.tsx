import '@mantine/core/styles.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { VercelToolbar } from '@vercel/toolbar/next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import Footer from '@/components/footer';
import TopNav from '@/components/top-nav';
import { getModes } from '@/services/modes';
import { appinfo } from '@/utils/constants';
import { theme } from '../theme';

export const metadata = {
  title: appinfo.title,
  description: appinfo.description,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const modes = await getModes();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <meta name="viewport" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <TopNav modes={modes} />
          <main role="main">{children}</main>
          <Footer />
        </MantineProvider>
        <SpeedInsights />
        <Analytics />
        {process.env.NODE_ENV === 'development' && <VercelToolbar />}
      </body>
    </html>
  );
}
