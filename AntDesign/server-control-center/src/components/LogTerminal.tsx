'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Typography } from 'antd';
import type { LogEntry } from '@/types';

const { Text } = Typography;

export const LogTerminal: React.FC = React.memo(() => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        const newLogs: LogEntry[] = await res.json();
        
        if (active) {
          setLogs(prev => {
            const updated = [...prev, ...newLogs];
            if (updated.length > 20) {
              return updated.slice(updated.length - 20);
            }
            return updated;
          });
        }
      } catch (e) {
        // ignore
      }
    };

    const interval = setInterval(fetchLogs, 2000);
    fetchLogs();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Autoscroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO': return '#1677ff';
      case 'WARN': return '#faad14';
      case 'ERROR': return '#ff4d4f';
      case 'SUCCESS': return '#52c41a';
      default: return '#fff';
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <Typography.Title level={5} style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
        Terminal de Logs em Tempo Real
      </Typography.Title>
      <div 
        ref={terminalRef}
        style={{
          backgroundColor: '#000',
          border: '1px solid #303030',
          borderRadius: '8px',
          padding: '16px',
          height: '250px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {logs.length === 0 ? (
          <Text style={{ color: '#595959' }}>Aguardando conexão com stream de logs...</Text>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <Text style={{ color: '#595959', whiteSpace: 'nowrap' }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </Text>
              <Text style={{ color: getLogColor(log.level), fontWeight: 'bold', width: '60px' }}>
                {log.level}
              </Text>
              <Text style={{ color: '#8c8c8c', width: '120px' }}>
                [{log.server}]
              </Text>
              <Text style={{ color: '#d9d9d9' }}>
                {log.message}
              </Text>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

LogTerminal.displayName = 'LogTerminal';
