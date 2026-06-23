'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Container } from '@mantine/core';
import { Header } from '../components/Header/Header';
import { ServerGrid } from '../components/ServerGrid/ServerGrid';
import { LogTerminal } from '../components/LogTerminal/LogTerminal';
import { ServerDetailsPanel } from '../components/ServerDetailsPanel/ServerDetailsPanel';
import { BenchmarkAnalyzer } from '../components/BenchmarkAnalyzer/BenchmarkAnalyzer';
import { useInfrastructureData } from '../utils/useInfrastructureData';

export default function Home() {
  if (typeof window !== 'undefined' && !performance.getEntriesByName('dashboard-mount-start').length) {
    performance.mark('dashboard-mount-start');
  }

  const { servers, logs, lastSync, getDetailedDataForServer } = useInfrastructureData();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const handleServerClick = useCallback((serverId: string) => {
    setSelectedServerId(serverId);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedServerId(null);
  }, []);

  const selectedServerName = useMemo(() => {
    return servers.find(s => s.id === selectedServerId)?.name || '';
  }, [servers, selectedServerId]);

  const selectedServerData = useMemo(() => {
    if (!selectedServerId) return [];
    return getDetailedDataForServer(selectedServerId);
  }, [selectedServerId, getDetailedDataForServer]);

  useEffect(() => {
    performance.mark('dashboard-mount-end');
    try {
      performance.measure('Dashboard Mount', 'dashboard-mount-start', 'dashboard-mount-end');
    } catch(e) {}
  }, []);

  return (
    <Container size="xl" py="xl">
      <Header lastSync={lastSync} />
      
      <ServerGrid servers={servers} onServerClick={handleServerClick} />
      
      <LogTerminal logs={logs} />

      <ServerDetailsPanel
        opened={!!selectedServerId}
        onClose={handleClosePanel}
        serverName={selectedServerName}
        data={selectedServerData}
      />

      <BenchmarkAnalyzer />
    </Container>
  );
}
