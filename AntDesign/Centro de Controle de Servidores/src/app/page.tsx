'use client';

import React, { useState, useCallback } from 'react';
import { Layout } from 'antd';
import { Header } from '@/components/Header';
import { ServerGrid } from '@/components/ServerGrid';
import { LogTerminal } from '@/components/LogTerminal';
import { DetailsPanel } from '@/components/DetailsPanel';
import { BenchmarkAnalyzer } from '@/components/BenchmarkAnalyzer';
import type { ServerData } from '@/types';

const { Content } = Layout;

export default function Dashboard() {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);

  const handleSync = useCallback((timestamp: string) => {
    setLastSync(timestamp);
    setIsActive(true);
  }, []);

  const handleSelectServer = useCallback((server: ServerData) => {
    setSelectedServer(server);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedServer(null);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: '#141414' }}>
      <Header lastSync={lastSync} isActive={isActive} />
      
      <Content style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <ServerGrid onSelectServer={handleSelectServer} onSync={handleSync} />
        <LogTerminal />
      </Content>

      <DetailsPanel 
        server={selectedServer} 
        onClose={handleClosePanel} 
      />

      <BenchmarkAnalyzer />
    </Layout>
  );
}
