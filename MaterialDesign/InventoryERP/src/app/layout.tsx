import type { Metadata } from 'next';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';
import { InventoryProvider } from '@/store/InventoryContext';
import { BenchmarkAnalyzer } from '@/components/Benchmark/BenchmarkAnalyzer';
import './globals.css';

export const metadata: Metadata = {
  title: 'InventoryERP | Alta Performance B2B',
  description: 'Matriz de Inventário ERP Avançado e Fluxo de Pedidos B2B',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <InventoryProvider>
            {children}
            <BenchmarkAnalyzer />
          </InventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
