'use client';

import React, { useEffect, useRef } from 'react';
import { Card, Typography, Row, Col, Badge, Space } from 'antd';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { ServerData } from '@/types';

const { Text } = Typography;

interface ServerCardProps {
  server: ServerData;
  onClick: (server: ServerData) => void;
}

export const ServerCard: React.FC<ServerCardProps> = React.memo(({ server, onClick }) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const markName = `CardMount-${server.id}-${renderCount.current}`;
    performance.mark(`${markName}-start`);
    
    return () => {
      performance.mark(`${markName}-end`);
      try {
        performance.measure(
          `Render Card [${server.name}]`,
          `${markName}-start`,
          `${markName}-end`
        );
      } catch (e) {
        // Ignore if marks are cleared
      }
    };
  });

  const getStatusColor = () => {
    switch (server.status) {
      case 'ONLINE': return '#52c41a';
      case 'OVERLOAD': return '#ff4d4f';
      case 'IDLE': return '#d9d9d9';
      default: return '#1677ff';
    }
  };

  const getStatusBadge = () => {
    switch (server.status) {
      case 'ONLINE': return 'success';
      case 'OVERLOAD': return 'error';
      case 'IDLE': return 'default';
      default: return 'processing';
    }
  };

  const isOverload = server.status === 'OVERLOAD';

  return (
    <Card
      hoverable
      onClick={() => onClick(server)}
      style={{
        background: '#1f1f1f',
        borderColor: isOverload ? '#ff4d4f' : '#303030',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Space direction="vertical" size={0}>
            <Text style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>
              {server.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              PID: {server.pid}
            </Text>
          </Space>
        </Col>
        <Col>
          <Badge status={getStatusBadge()} text={<Text style={{ color: getStatusColor(), fontSize: '12px', fontWeight: 'bold' }}>{server.status}</Text>} />
        </Col>
      </Row>

      <Row gutter={16} align="middle">
        <Col span={12}>
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Row justify="space-between">
              <Text type="secondary" style={{ fontSize: '12px' }}>CPU</Text>
              <Text style={{ color: server.cpu > 85 ? '#ff4d4f' : '#fff', fontWeight: 500 }}>
                {server.cpu.toFixed(1)}%
              </Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary" style={{ fontSize: '12px' }}>RAM</Text>
              <Text style={{ color: server.ram > 90 ? '#ff4d4f' : '#fff', fontWeight: 500 }}>
                {server.ram.toFixed(1)}%
              </Text>
            </Row>
          </Space>
        </Col>
        
        <Col span={12}>
          <div style={{ height: '50px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={server.history}>
                <YAxis domain={[0, 100]} hide />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#1677ff" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false} // Disable animation for performance on high-frequency updates
                />
                <Line 
                  type="monotone" 
                  dataKey="ram" 
                  stroke="#52c41a" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to only re-render if actual metrics or history reference changed
  return (
    prevProps.server.cpu === nextProps.server.cpu &&
    prevProps.server.ram === nextProps.server.ram &&
    prevProps.server.status === nextProps.server.status &&
    prevProps.server.history === nextProps.server.history
  );
});

ServerCard.displayName = 'ServerCard';
