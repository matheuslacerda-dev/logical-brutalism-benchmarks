import { useEffect, useRef, memo } from 'react';
import { Box, Text, Title, Paper } from '@mantine/core';
import { LogEntry } from '../../utils/useInfrastructureData';

interface LogTerminalProps {
  logs: LogEntry[];
}

function LogTerminalComponent({ logs }: LogTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getColorByLevel = (level: string) => {
    switch (level) {
      case 'INFO': return 'blue.4';
      case 'WARN': return 'yellow.4';
      case 'ERROR': return 'red.4';
      case 'SUCCESS': return 'green.4';
      default: return 'gray.4';
    }
  };

  return (
    <Paper mt="xl" shadow="sm" radius="md" p="md" bg="var(--mantine-color-dark-8)" withBorder>
      <Title order={4} mb="sm" c="gray.3" ff="monospace">
        &gt; Terminal de Logs (Live)
      </Title>
      <Box
        ref={scrollRef}
        style={{
          height: 250,
          overflowY: 'auto',
          backgroundColor: 'var(--mantine-color-dark-9)',
          padding: '1rem',
          borderRadius: 'var(--mantine-radius-sm)',
          fontFamily: 'monospace'
        }}
      >
        {logs.length === 0 && (
          <Text c="dimmed" size="sm">Aguardando logs do sistema...</Text>
        )}
        {logs.map((log) => (
          <Text key={log.id} size="sm" mb={4} c={getColorByLevel(log.level)}>
            [{log.timestamp.toLocaleTimeString()}] {log.message}
          </Text>
        ))}
      </Box>
    </Paper>
  );
}

export const LogTerminal = memo(LogTerminalComponent, (prev, next) => prev.logs === next.logs);
