'use client';
import React, { memo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ServerMetrics } from '@/app/api/metrics/route';

interface DetailsPanelProps {
  server: ServerMetrics | null;
}

const DetailsPanel = memo(({ server }: DetailsPanelProps) => {
  useEffect(() => {
    if (server) {
      performance.mark(`ChartMountStart-${server.id}`);
      return () => {
        performance.mark(`ChartMountEnd-${server.id}`);
        performance.measure(`chart-update-${server.id}`, `ChartMountStart-${server.id}`, `ChartMountEnd-${server.id}`);
      };
    }
  });

  if (!server) {
    return (
      <Card sx={{ p: 3, height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212', border: '1px solid #333' }}>
        <Typography color="text.secondary">
          Select a server to view detailed metrics
        </Typography>
      </Card>
    );
  }

  // Format time for tooltip and axis
  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ p: 3, height: '100%', minHeight: 300, backgroundColor: '#121212', border: '1px solid #333' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#f0f0f0' }}>
            {server.name} <Typography component="span" color="text.secondary" variant="body2">(PID: {server.pid})</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: '#00e676' }}>
            Performance over last 24 events
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={server.history}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2979ff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2979ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e676" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              tickFormatter={formatTime} 
              stroke="#666" 
              tick={{ fill: '#666', fontSize: 12 }} 
              minTickGap={30}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#666" 
              tick={{ fill: '#666', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px' }}
              labelFormatter={(label) => formatTime(label as string)}
              itemStyle={{ color: '#f0f0f0' }}
            />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="#2979ff" 
              fillOpacity={1} 
              fill="url(#colorCpu)" 
              isAnimationActive={false} // Disable to save render ms
            />
            <Area 
              type="monotone" 
              dataKey="ram" 
              stroke="#00e676" 
              fillOpacity={1} 
              fill="url(#colorRam)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the selected server changed or its history updated
  // Actually, since we update the server reference in page.tsx on data fetch,
  // we can just check if server reference changed, but because we want to be strict:
  return prevProps.server?.history.length === nextProps.server?.history.length &&
         prevProps.server?.id === nextProps.server?.id &&
         prevProps.server?.cpu === nextProps.server?.cpu &&
         prevProps.server?.ram === nextProps.server?.ram;
});

DetailsPanel.displayName = 'DetailsPanel';
export default DetailsPanel;
