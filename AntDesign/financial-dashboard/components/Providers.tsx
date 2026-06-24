'use client';

import { ConfigProvider, theme } from 'antd';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1', // Indigo 500
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          colorBgBase: '#0f172a', // Slate 900
          colorBgContainer: '#1e293b', // Slate 800
          colorBgElevated: '#334155', // Slate 700
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
        },
        components: {
          Card: {
            colorBgContainer: 'transparent',
          },
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}
