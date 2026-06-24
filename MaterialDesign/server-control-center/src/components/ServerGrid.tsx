'use client';
import React from 'react';
import Box from '@mui/material/Box';
import ServerCard from './ServerCard';
import { ServerMetrics } from '@/app/api/metrics/route';

interface ServerGridProps {
  servers: ServerMetrics[];
  selectedServerId: string | null;
  onSelectServer: (id: string) => void;
}

export default function ServerGrid({ servers, selectedServerId, onSelectServer }: ServerGridProps) {
  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
        gap: 2,
        mb: 2
      }}
    >
      {servers.map(server => (
        <ServerCard 
          key={server.id} 
          server={server} 
          selected={server.id === selectedServerId}
          onClick={onSelectServer} 
        />
      ))}
    </Box>
  );
}
