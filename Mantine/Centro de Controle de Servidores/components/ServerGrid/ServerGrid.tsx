import { SimpleGrid } from '@mantine/core';
import { ServerMetrics } from '../../utils/useInfrastructureData';
import { ServerCard } from './ServerCard';

interface ServerGridProps {
  servers: ServerMetrics[];
  onServerClick: (serverId: string) => void;
}

export function ServerGrid({ servers, onServerClick }: ServerGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
      {servers.map(server => (
        <ServerCard key={server.id} server={server} onClick={onServerClick} />
      ))}
    </SimpleGrid>
  );
}
