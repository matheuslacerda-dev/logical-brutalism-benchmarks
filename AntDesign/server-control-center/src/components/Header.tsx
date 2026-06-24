'use client';

import React from 'react';
import { Layout, Typography, Space, Badge, theme } from 'antd';
import { SyncOutlined, DesktopOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  lastSync: string | null;
  isActive: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({ lastSync, isActive }) => {
  const {
    token: { colorBgContainer, colorBorder },
  } = theme.useToken();

  return (
    <AntHeader
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: colorBgContainer,
        borderBottom: `1px solid ${colorBorder}`,
        padding: '0 24px',
        height: '64px',
      }}
    >
      <Space align="center" size="middle">
        <DesktopOutlined style={{ fontSize: '24px', color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>
          Centro de Controle de Servidores - Ant Design
        </Title>
      </Space>

      <Space size="large" align="center">
        <Space>
          <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            Último Sync:
          </Text>
          <Text style={{ fontFamily: 'monospace', fontWeight: 500, width: '80px' }}>
            {lastSync ? lastSync : '--:--:--'}
          </Text>
        </Space>
        
        <div
          style={{
            background: isActive ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
            border: `1px solid ${isActive ? '#52c41a' : '#ff4d4f'}`,
            padding: '4px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isActive ? (
            <SyncOutlined spin style={{ color: '#52c41a', fontSize: '12px' }} />
          ) : (
            <Badge status="error" />
          )}
          <Text
            style={{
              color: isActive ? '#52c41a' : '#ff4d4f',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {isActive ? '[STREAM_ACTIVE]' : '[STREAM_OFFLINE]'}
          </Text>
        </div>
      </Space>
    </AntHeader>
  );
});

Header.displayName = 'Header';
