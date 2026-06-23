'use client';
import { Profiler, useState } from 'react';
import { Card, Text, Group, Skeleton, SegmentedControl, Box } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import useSWR from 'swr';


const fetcher = async (url: string) => {
  const start = performance.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  const duration = performance.now() - start;
  import('@/utils/benchmarkStore').then(m => m.benchmarkStore.reportChartUpdate(Math.round(duration)));
  return data;
};

export function DetailedChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState('1mo');
  const { data: history, error } = useSWR(`/api/history?symbol=${symbol}&range=${range}`, fetcher, { refreshInterval: 60000 });

  if (!history && !error) {
    return <Skeleton height={400} radius="md" />;
  }

  const chartData = history?.quotes
    ?.filter((q: any) => q.close !== null)
    .map((q: any) => ({
      date: new Date(q.date).toLocaleDateString([], { month: 'short', day: 'numeric', ...(range === '1d' || range === '5d' ? { hour: '2-digit', minute: '2-digit' } : {}) }),
      price: q.close
    })) || [];

  const onRender = (id: string, phase: string, actualDuration: number) => {
    if (phase === 'mount') {
      import('@/utils/benchmarkStore').then(m => m.benchmarkStore.update({ charts_render_ms: Math.round(actualDuration) }));
    } else {
      import('@/utils/benchmarkStore').then(m => m.benchmarkStore.reportChartUpdate(actualDuration));
    }
  };

  return (
    <Profiler id={`DetailedChart-${symbol}`} onRender={onRender}>
      <Card shadow="sm" padding="xl" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Text fw={700} size="xl">{symbol} Performance</Text>
        <SegmentedControl
          value={range}
          onChange={setRange}
          data={[
            { label: '1D', value: '1d' },
            { label: '5D', value: '5d' },
            { label: '1M', value: '1mo' },
            { label: '6M', value: '6mo' },
            { label: '1Y', value: '1y' },
            { label: '5Y', value: '5y' }
          ]}
        />
      </Group>

      <Box h={300}>
        {chartData.length > 0 ? (
          <AreaChart
            h={300}
            data={chartData}
            dataKey="date"
            series={[{ name: 'price', color: 'blue.6' }]}
            strokeWidth={2}
            fillOpacity={0.2}
            curveType="monotone"
            tooltipAnimationDuration={200}
            gridAxis="xy"
          />
        ) : (
          <Skeleton height={300} radius="sm" />
        )}
      </Box>
    </Card>
    </Profiler>
  );
}
