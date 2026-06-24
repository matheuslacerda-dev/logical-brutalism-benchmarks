import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Providers } from "@/components/Providers";
import { PerformancePanel } from "@/components/PerformancePanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ant Design",
  description: "Real-time financial dashboard using Yahoo Finance API and Ant Design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
        <PerformancePanel />
      </body>
    </html>
  );
}
