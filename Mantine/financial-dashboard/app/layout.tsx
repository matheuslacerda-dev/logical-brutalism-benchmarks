import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import React from 'react';
import { theme } from '../theme';

export const metadata = {
  title: 'Mantine Design System',
  description: 'Real-time financial dashboard built with Mantine',
};

import { BenchmarkedApp } from '@/components/BenchmarkedApp';
import { PerformanceBenchmark } from '@/components/PerformanceBenchmark';

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <BenchmarkedApp>
            {children}
            <PerformanceBenchmark />
          </BenchmarkedApp>
        </MantineProvider>
      </body>
    </html>
  );
}
