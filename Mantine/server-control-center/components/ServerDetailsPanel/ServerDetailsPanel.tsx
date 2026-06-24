import { Drawer, Text, Stack } from '@mantine/core';
import { AreaChart } from '@mantine/charts';

interface ServerDetailsPanelProps {
  opened: boolean;
  onClose: () => void;
  serverName: string;
  data: any[]; // The 24h detailed data
}

export function ServerDetailsPanel({ opened, onClose, serverName, data }: ServerDetailsPanelProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={`Detalhes de Performance - ${serverName}`}
      position="right"
      size="lg"
      padding="xl"
    >
      <Stack gap="xl" mt="md">
        <Text size="sm" c="dimmed">
          Histórico detalhado das últimas 24 horas. Exibindo consumo de CPU e Memória RAM.
        </Text>
        
        <Text fw={500}>Uso de CPU e RAM (%)</Text>
        {data.length > 0 ? (
          <AreaChart
            h={300}
            data={data}
            dataKey="time"
            series={[
              { name: 'cpu', color: 'blue.5' },
              { name: 'ram', color: 'teal.5' },
            ]}
            curveType="monotone"
            withDots={false}
            withGradient
          />
        ) : (
          <Text size="sm" c="dimmed">Nenhum dado disponível.</Text>
        )}
      </Stack>
    </Drawer>
  );
}
