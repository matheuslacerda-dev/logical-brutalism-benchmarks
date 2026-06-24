import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import React from 'react';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';

export const metadata = {
  title: 'Centro de Controle de Servidores',
  description: 'Dashboard Operacional de Alta Densidade de Dados',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider defaultColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
