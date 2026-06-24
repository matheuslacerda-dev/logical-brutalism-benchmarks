'use client';
import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  message: string;
}

export default function LogTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const newLogs: LogEntry[] = await res.json();
          setLogs(prev => {
            const combined = [...prev, ...newLogs];
            // Keep only the last 20 logs
            return combined.slice(Math.max(combined.length - 20, 0));
          });
        }
      } catch (err) {
        console.error('Failed to fetch logs', err);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll every 2 seconds
    interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: string) => {
    if (type.includes('WARN')) return '#ff9100';
    if (type.includes('ERR')) return '#ff1744';
    if (type.includes('ALERT')) return '#ff1744';
    if (type.includes('SEC')) return '#d500f9';
    return '#00e676';
  };

  return (
    <Paper 
      sx={{ 
        backgroundColor: '#050505', 
        border: '1px solid #333', 
        borderRadius: 1,
        p: 1.5,
        height: '100%',
        minHeight: 250,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ borderBottom: '1px solid #333', pb: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#333' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#333' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#333' }} />
        <Typography variant="caption" sx={{ ml: 1, color: '#666', fontFamily: 'monospace' }}>
          ~/sys/logs/stream
        </Typography>
      </Box>

      <Box 
        ref={terminalRef}
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          fontFamily: 'monospace',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#333',
            borderRadius: '3px',
          }
        }}
      >
        {logs.map(log => (
          <Box key={log.id} sx={{ display: 'flex', mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#666', mr: 2, minWidth: 160 }}>
              {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
            </Typography>
            <Typography variant="body2" sx={{ color: getLogColor(log.type), whiteSpace: 'nowrap' }}>
              {log.message}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
