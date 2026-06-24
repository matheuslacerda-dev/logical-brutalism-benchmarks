'use client';

import React from 'react';
import { Card, Statistic, Typography, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import useSWR from 'swr';

const { Text } = Typography;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StockCardProps {
  symbol: string;
}

export function StockCard({ symbol }: StockCardProps) {
  if (typeof performance !== 'undefined' && !performance.getEntriesByName(`widgets_render_start_${symbol}`).length) {
    performance.mark(`widgets_render_start_${symbol}`);
  }

  React.useEffect(() => {
    try {
      performance.mark(`widgets_render_end_${symbol}`);
      performance.measure('widgets_render_duration', `widgets_render_start_${symbol}`, `widgets_render_end_${symbol}`);
    } catch(e) {}
  }, [symbol]);

  const { data, error, isLoading } = useSWR(`/api/quote?symbol=${symbol}`, fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds for "real-time" feel
  });

  if (error) return <Card className="glass-panel" style={{ minHeight: 140 }}><Text type="danger">Erro ao carregar</Text></Card>;
  if (isLoading && !data) return <Card className="glass-panel" style={{ minHeight: 140 }}><Skeleton active /></Card>;
  if (!data) return null;

  const isPositive = data.regularMarketChange >= 0;

  return (
    <Card className="glass-panel" variant="borderless" style={{ minHeight: 140 }}>
      <Statistic
        title={<Text style={{ color: '#94a3b8', fontSize: '16px' }}>{data.shortName || symbol} ({symbol})</Text>}
        value={data.regularMarketPrice}
        precision={2}
        styles={{ content: { color: isPositive ? '#10b981' : '#ef4444', fontWeight: 'bold' } }}
        prefix={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        suffix={data.currency}
      />
      <div style={{ marginTop: '8px' }}>
        <Text style={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: 500 }}>
          {isPositive ? '+' : ''}{data.regularMarketChange?.toFixed(2)} ({data.regularMarketChangePercent?.toFixed(2)}%)
        </Text>
      </div>
    </Card>
  );
}
