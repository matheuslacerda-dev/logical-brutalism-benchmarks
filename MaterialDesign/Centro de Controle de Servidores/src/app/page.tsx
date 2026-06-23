'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Header from '@/components/Header';
import ServerGrid from '@/components/ServerGrid';
import DetailsPanel from '@/components/DetailsPanel';
import LogTerminal from '@/components/LogTerminal';
import BenchmarkAnalyzer from '@/components/BenchmarkAnalyzer';
import { ServerMetrics } from '@/app/api/metrics/route';

export default function Dashboard() {
  const [servers, setServers] = useState<ServerMetrics[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    performance.mark('DashboardMountStart');
    return () => {
      performance.mark('DashboardMountEnd');
      performance.measure('dashboard-mount', 'DashboardMountStart', 'DashboardMountEnd');
    };
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      performance.mark('FetchMetrics-Start');
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const data: ServerMetrics[] = await res.json();
        setServers(data);
        window.dispatchEvent(new Event('DATA_SYNC'));
      }
      performance.mark('FetchMetrics-End');
      performance.measure('FetchMetrics-Duration', 'FetchMetrics-Start', 'FetchMetrics-End');
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleSelectServer = useCallback((id: string) => {
    setSelectedServerId(id);
  }, []);

  const selectedServer = React.useMemo(() => {
    return servers.find(s => s.id === selectedServerId) || null;
  }, [servers, selectedServerId]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      
      <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <ServerGrid 
          servers={servers} 
          selectedServerId={selectedServerId} 
          onSelectServer={handleSelectServer} 
        />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flex: 1, minHeight: 0 }}>
          <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
            <DetailsPanel server={selectedServer} />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <LogTerminal />
          </Box>
        </Box>
      </Box>

      <BenchmarkAnalyzer />
    </Box>
  );
}
