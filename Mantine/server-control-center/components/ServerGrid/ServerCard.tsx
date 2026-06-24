import React, { memo } from 'react';
import { Card, Text, Group, Badge, Stack } from '@mantine/core';
import { Sparkline } from '@mantine/charts';
import { ServerMetrics } from '../../utils/useInfrastructureData';
import { IconServer } from '@tabler/icons-react';

interface ServerCardProps {
  server: ServerMetrics;
  onClick: (serverId: string) => void;
}

function ServerCardComponent({ server, onClick }: ServerCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'green';
      case 'OVERLOAD': return 'orange';
      case 'IDLE': return 'gray';
      default: return 'blue';
    }
  };

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder 
      style={{ cursor: 'pointer', transition: 'transform 0.2s ease', backgroundColor: 'var(--mantine-color-dark-7)' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
      onClick={() => onClick(server.id)}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconServer size={20} color={`var(--mantine-color-${getStatusColor(server.status)}-5)`} />
          <Text fw={600} size="md">{server.name}</Text>
        </Group>
        <Badge color={getStatusColor(server.status)} variant="light">
          {server.status}
        </Badge>
      </Group>

      <Text size="xs" c="dimmed" mb="md">PID: {server.pid}</Text>

      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>CPU</Text>
          <Text size="sm" c="dimmed">{server.cpu}%</Text>
        </Group>
        <Sparkline
          w="100%"
          h={30}
          data={server.cpuHistory}
          color="blue.5"
          curveType="monotone"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        
        <Group justify="space-between" mt="sm">
          <Text size="sm" fw={500}>RAM</Text>
          <Text size="sm" c="dimmed">{server.ram}%</Text>
        </Group>
        <Sparkline
          w="100%"
          h={30}
          data={server.ramHistory}
          color="teal.5"
          curveType="monotone"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </Stack>
    </Card>
  );
}

// Memoized to avoid unnecessary re-renders when data from other cards change
export const ServerCard = memo(ServerCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.server.cpu === nextProps.server.cpu &&
    prevProps.server.ram === nextProps.server.ram &&
    prevProps.server.status === nextProps.server.status &&
    prevProps.server.id === nextProps.server.id
  );
});
