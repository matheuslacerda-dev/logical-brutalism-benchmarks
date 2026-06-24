'use client';
import React, { useEffect, memo } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { ServerMetrics } from '@/app/api/metrics/route';

interface ServerCardProps {
  server: ServerMetrics;
  onClick: (id: string) => void;
  selected: boolean;
}

const ServerCard = memo(({ server, onClick, selected }: ServerCardProps) => {
  // Performance measurement hook
  useEffect(() => {
    performance.mark(`WidgetMountStart-${server.id}`);
    return () => {
      performance.mark(`WidgetMountEnd-${server.id}`);
      performance.measure(`widget-update-${server.id}`, `WidgetMountStart-${server.id}`, `WidgetMountEnd-${server.id}`);
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#00e676';
      case 'OVERLOAD': return '#ff1744';
      case 'IDLE': return '#ff9100';
      default: return '#a0a0a0';
    }
  };

  const statusColor = getStatusColor(server.status);
  
  // To avoid recharts re-rendering the whole page or jumping,
  // we pass a very minimal dataset. Recharts sparkline is just a LineChart.
  // We slice the history to the last 20 elements to be safe.
  const chartData = server.history.slice(-20);

  return (
    <Card 
      onClick={() => onClick(server.id)}
      sx={{ 
        p: 2, 
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderColor: selected ? '#2979ff' : '#333',
        backgroundColor: selected ? 'rgba(41, 121, 255, 0.05)' : '#121212',
        '&:hover': {
          borderColor: '#2979ff',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {server.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor }} />
          <Typography variant="caption" sx={{ color: statusColor, fontWeight: 'bold' }}>
            {server.status}
          </Typography>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        PID: {server.pid}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">CPU</Typography>
          <Typography variant="h6" sx={{ color: server.cpu > 85 ? '#ff1744' : '#f0f0f0' }}>
            {server.cpu}%
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">RAM</Typography>
          <Typography variant="h6" sx={{ color: server.ram > 90 ? '#ff1744' : '#f0f0f0' }}>
            {server.ram}%
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: 40, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={[0, 100]} hide />
            <Line 
              type="monotone" 
              dataKey="cpu" 
              stroke="#2979ff" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false} // Disable animation for absolute performance during polling
            />
            <Line 
              type="monotone" 
              dataKey="ram" 
              stroke="#00e676" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom equality check: only re-render if:
  // 1. Selection state changed
  // 2. The server object reference changed (which happens in our API update logic only when data is new)
  // 3. Or deep check the latest data point if references are immutable
  return prevProps.selected === nextProps.selected && 
         prevProps.server.cpu === nextProps.server.cpu &&
         prevProps.server.ram === nextProps.server.ram &&
         prevProps.server.status === nextProps.server.status;
});

ServerCard.displayName = 'ServerCard';
export default ServerCard;
