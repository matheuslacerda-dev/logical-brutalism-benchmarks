'use client';

import React, { useMemo } from 'react';
import { Card, Skeleton, Typography } from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import useSWR from 'swr';

const { Title } = Typography;
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StockChartProps {
  symbol: string;
  interval?: string;
}

export function StockChart({ symbol, interval = '1d' }: StockChartProps) {
  if (typeof performance !== 'undefined' && !performance.getEntriesByName(`charts_render_start_${symbol}`).length) {
    performance.mark(`charts_render_start_${symbol}`);
  }

  React.useEffect(() => {
    try {
      performance.mark(`charts_render_end_${symbol}`);
      performance.measure('charts_render_duration', `charts_render_start_${symbol}`, `charts_render_end_${symbol}`);
    } catch(e) {}
  }, [symbol]);

  // Compute start date for 1 year ago for default chart
  const period1 = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const { data, error, isLoading } = useSWR(`/api/chart?symbol=${symbol}&period1=${period1}&interval=${interval}`, fetcher);

  if (error || (data && data.error)) return <Card className="glass-panel" style={{ height: '100%', minHeight: 400 }}><Typography.Text type="danger">Erro ao carregar gráfico</Typography.Text></Card>;
  if (isLoading && !data) return <Card className="glass-panel" style={{ height: '100%', minHeight: 400 }}><Skeleton active paragraph={{ rows: 8 }} /></Card>;

  // Format data for Recharts
  const chartData = Array.isArray(data) ? data.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: '2-digit' }),
    price: item.close,
  })) : [];

  return (
    <Card className="glass-panel" style={{ height: '100%', minHeight: 400 }}>
      <Title level={4} style={{ color: '#f8fafc', marginBottom: '24px' }}>Histórico de Preço - {symbol}</Title>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(value) => `$${value.toFixed(0)}`} width={60} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Preço']}
            />
            <Area type="monotone" dataKey="price" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
