'use client';
import { Profiler } from 'react';
import { Card, Text, Group, Badge, Skeleton, Box, useMantineTheme } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import useSWR from 'swr';
import { AreaChart } from '@mantine/charts';

const fetcher = async (url: string) => {
  const start = performance.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  const duration = performance.now() - start;
  import('@/utils/benchmarkStore').then(m => m.benchmarkStore.reportWidgetUpdate(Math.round(duration)));
  return data;
};

export function StockCard({ symbol, onClick, active }: { symbol: string, onClick?: () => void, active?: boolean }) {
  const { data: quote, error: quoteError } = useSWR(`/api/quote?symbol=${symbol}`, fetcher, { refreshInterval: 10000 });
  const { data: history, error: historyError } = useSWR(`/api/history?symbol=${symbol}&range=1d`, fetcher, { refreshInterval: 60000 });
  
  if (!quote && !quoteError) {
    return <Skeleton height={180} radius="md" />;
  }

  const price = quote?.regularMarketPrice;
  const change = quote?.regularMarketChange;
  const changePercent = quote?.regularMarketChangePercent;
  const isPositive = change >= 0;

  const chartData = history?.quotes
    ?.filter((q: any) => q.close !== null)
    .map((q: any) => ({
      time: new Date(q.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: q.close
    })) || [];

  const onRender = (id: string, phase: string, actualDuration: number) => {
    if (phase === 'update') {
      import('@/utils/benchmarkStore').then(m => m.benchmarkStore.reportWidgetUpdate(actualDuration));
    }
  };

  return (
    <Profiler id={`StockCard-${symbol}`} onRender={onRender}>
      <Card 
        shadow="sm" 
        padding="lg" 
      radius="md" 
      withBorder 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? 'var(--mantine-color-blue-filled)' : undefined,
        borderWidth: active ? 2 : 1
      }}
    >
      <Group justify="space-between" mb="xs">
        <Text fw={700} size="xl">{symbol}</Text>
        <Badge color={isPositive ? 'teal' : 'red'} variant="light" size="lg">
          <Group gap={4}>
            {isPositive ? <IconTrendingUp size={16} /> : <IconTrendingDown size={16} />}
            {changePercent?.toFixed(2)}%
          </Group>
        </Badge>
      </Group>

      <Text size="h2" fw={900} mb="md">
        ${price?.toFixed(2)}
      </Text>
      
      <Text c="dimmed" size="xs" mb="sm">Last 24h Trend</Text>
      <Box h={60}>
        {chartData.length > 0 ? (
           <AreaChart
             h={60}
             data={chartData}
             dataKey="time"
             series={[{ name: 'price', color: isPositive ? 'teal.6' : 'red.6' }]}
             withXAxis={false}
             withYAxis={false}
             withDots={false}
             withTooltip={false}
             strokeWidth={2}
             fillOpacity={0.2}
             curveType="monotone"
           />
        ) : (
          <Skeleton height={60} radius="sm" />
        )}
      </Box>
    </Card>
    </Profiler>
  );
}
