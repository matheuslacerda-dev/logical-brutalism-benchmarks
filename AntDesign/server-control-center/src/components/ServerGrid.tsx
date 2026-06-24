'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography } from 'antd';
import { ServerCard } from './ServerCard';
import type { ServerData } from '@/types';

const { Title } = Typography;

interface ServerGridProps {
  onSelectServer: (server: ServerData) => void;
  onSync: (timestamp: string) => void;
}

export const ServerGrid: React.FC<ServerGridProps> = ({ onSelectServer, onSync }) => {
  const [servers, setServers] = useState<ServerData[]>([]);

  const fetchMetrics = useCallback(async () => {
    try {
      performance.mark('FetchMetrics-start');
      const res = await fetch('/api/metrics');
      const data: ServerData[] = await res.json();
      
      const nowStr = new Date().toLocaleTimeString();
      onSync(nowStr);

      setServers(prev => {
        if (prev.length === 0) {
          return data.map(s => ({ ...s, history: [{ time: nowStr, cpu: s.cpu, ram: s.ram }] }));
        }

        return data.map(newServer => {
          const oldServer = prev.find(p => p.id === newServer.id);
          const newPoint = { time: nowStr, cpu: newServer.cpu, ram: newServer.ram };
          
          let updatedHistory = oldServer ? [...oldServer.history, newPoint] : [newPoint];
          if (updatedHistory.length > 20) {
            updatedHistory = updatedHistory.slice(updatedHistory.length - 20); // Keep last 20 points for sparkline
          }

          return {
            ...newServer,
            history: updatedHistory
          };
        });
      });
      performance.mark('FetchMetrics-end');
      performance.measure('FetchMetrics', 'FetchMetrics-start', 'FetchMetrics-end');
    } catch (e) {
      console.error('Failed to fetch metrics', e);
    }
  }, [onSync]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000); // 3 seconds polling
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={5} style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
        Monitoramento de Infraestrutura (Tempo Real)
      </Title>
      <Row gutter={[16, 16]}>
        {servers.map(server => (
          <Col xs={24} sm={12} md={12} lg={6} xl={6} key={server.id}>
            <ServerCard server={server} onClick={onSelectServer} />
          </Col>
        ))}
      </Row>
    </div>
  );
};
