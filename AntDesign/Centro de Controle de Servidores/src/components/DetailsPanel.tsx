'use client';

import React, { useMemo } from 'react';
import { Drawer, Typography, Descriptions, Row, Col, Space } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ServerData } from '@/types';

const { Title, Text } = Typography;

interface DetailsPanelProps {
  server: ServerData | null;
  onClose: () => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ server, onClose }) => {
  // Generate 24h dummy data for the selected server
  const mock24hData = useMemo(() => {
    if (!server) return [];
    const data = [];
    let currentCpu = server.cpu;
    let currentRam = server.ram;
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: `${time.getHours()}:00`,
        cpu: Math.max(0, Math.min(100, currentCpu + (Math.random() * 30 - 15))),
        ram: Math.max(0, Math.min(100, currentRam + (Math.random() * 20 - 10)))
      });
    }
    return data;
  }, [server]);

  return (
    <Drawer
      title={
        <Space>
          <Title level={4} style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>
            Detalhes do Servidor
          </Title>
          {server && (
            <Text type="secondary" style={{ fontFamily: 'monospace' }}>
              [{server.name}]
            </Text>
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={!!server}
      width={600}
      styles={{
        body: { backgroundColor: '#141414', padding: '24px' },
        header: { backgroundColor: '#1f1f1f', borderBottom: '1px solid #303030' }
      }}
    >
      {server && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Descriptions title={<Text style={{ color: '#fff' }}>Informações Básicas</Text>} bordered column={2} size="small" theme="dark">
            <Descriptions.Item label="ID Processo">{server.pid}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Text style={{ 
                color: server.status === 'ONLINE' ? '#52c41a' : 
                       server.status === 'OVERLOAD' ? '#ff4d4f' : '#d9d9d9',
                fontWeight: 'bold' 
              }}>
                {server.status}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="CPU Atual">{server.cpu.toFixed(1)}%</Descriptions.Item>
            <Descriptions.Item label="RAM Atual">{server.ram.toFixed(1)}%</Descriptions.Item>
          </Descriptions>

          <div>
            <Title level={5} style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
              Performance Histórica (Últimas 24h)
            </Title>
            <div style={{ height: 300, width: '100%', backgroundColor: '#1f1f1f', padding: '16px', borderRadius: '8px', border: '1px solid #303030' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mock24hData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#595959" fontSize={12} tickLine={false} />
                  <YAxis stroke="#595959" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#303030" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#303030', borderRadius: '4px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#1677ff" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="ram" name="RAM %" stroke="#52c41a" fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
