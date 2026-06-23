import { Group, Title, Badge, Text, Box } from '@mantine/core';
import { IconActivityHeartbeat } from '@tabler/icons-react';
import classes from './Header.module.css';

interface HeaderProps {
  lastSync: Date;
}

export function Header({ lastSync }: HeaderProps) {
  return (
    <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)', marginBottom: '1rem' }}>
      <Group justify="space-between" align="center">
        <Group>
          <IconActivityHeartbeat size={32} color="var(--mantine-color-green-5)" />
          <Title order={2} fw={700}>Mantine - Centro de Controle de Servidores</Title>
        </Group>
        <Group>
          <Text size="sm" c="dimmed">
            Último sync: {lastSync.toLocaleTimeString()}
          </Text>
          <Badge color="green" variant="light" size="lg" className={classes.pulse}>
            [STREAM_ACTIVE]
          </Badge>
        </Group>
      </Group>
    </Box>
  );
}
