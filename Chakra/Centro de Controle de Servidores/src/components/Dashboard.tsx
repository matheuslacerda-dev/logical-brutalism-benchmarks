'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Grid, GridItem, Container } from '@chakra-ui/react';
import Header from './Header';
import ServerCard from './ServerCard';
import LogTerminal from './LogTerminal';
import ServerDetailsPanel from './ServerDetailsPanel';
import BenchmarkAnalyzer from './BenchmarkAnalyzer';
import { ServerMetric, ServerState } from '../types';

export function Dashboard() {
  const [servers, setServers] = useState<Record<string, ServerState>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<string>('--:--:--');
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const mounted = useRef(false);

  useEffect(() => {
    performance.mark('dashboard-mount-start');
    mounted.current = true;
    performance.mark('dashboard-mount-end');
    performance.measure('dashboard-mount', 'dashboard-mount-start', 'dashboard-mount-end');
  }, []);

  // Poll Metrics (every 3 seconds)
  useEffect(() => {
    const fetchMetrics = async () => {
      performance.mark('widget-update-start');
      try {
        const res = await fetch('/api/metrics');
        const data: ServerMetric[] = await res.json();
        const now = new Date().toLocaleTimeString();
        
        setServers(prev => {
          const newServers = { ...prev };
          data.forEach(metric => {
            const timeKey = now.substring(0, 5);
            const history = newServers[metric.id]?.history || [];
            const updatedHistory = [...history, { time: timeKey, cpu: metric.cpu, ram: metric.ram }].slice(-20);
            
            newServers[metric.id] = {
              ...metric,
              history: updatedHistory,
            };
          });
          return newServers;
        });

        setLastSync(now);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      } finally {
        performance.mark('widget-update-end');
        performance.measure('widget-update', 'widget-update-start', 'widget-update-end');
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll Logs (every 2 seconds)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        
        setLogs(prev => {
          const newLogs = [...prev, data.log];
          if (newLogs.length > 20) return newLogs.slice(newLogs.length - 20);
          return newLogs;
        });
      } catch (err) {
        console.error('Failed to fetch logs', err);
      }
    };

    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    performance.mark('chart-update-start');
    setSelectedServerId(id);
    
    // Defer the end mark to simulate chart render frame end
    requestAnimationFrame(() => {
      performance.mark('chart-update-end');
      performance.measure('chart-update', 'chart-update-start', 'chart-update-end');
    });
  }, []);

  const serverList = useMemo(() => Object.values(servers), [servers]);
  const selectedServer = useMemo(() => {
    if (!selectedServerId) return null;
    return servers[selectedServerId] || null;
  }, [selectedServerId, servers]);

  return (
    <Container maxW="container.xl" py={6}>
      <Header lastSync={lastSync} />

      <Grid templateColumns={{ base: "1fr", lg: "repeat(12, 1fr)" }} gap={6}>
        <GridItem colSpan={{ base: 1, lg: 8 }}>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }} gap={4}>
            {serverList.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onClick={handleCardClick}
                isSelected={server.id === selectedServerId}
              />
            ))}
          </Grid>
          
          <Box mt={6}>
            <LogTerminal logs={logs} />
          </Box>
        </GridItem>

        <GridItem colSpan={{ base: 1, lg: 4 }}>
          <ServerDetailsPanel server={selectedServer} />
        </GridItem>
      </Grid>

      <BenchmarkAnalyzer />
    </Container>
  );
}
