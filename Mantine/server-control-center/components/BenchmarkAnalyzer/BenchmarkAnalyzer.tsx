import { Paper, Title, Text, Box, Button, SimpleGrid, Group } from '@mantine/core';
import { useBenchmark } from '../../utils/useBenchmark';
import { IconDownload } from '@tabler/icons-react';

export function BenchmarkAnalyzer() {
  const metrics = useBenchmark();

  const handleExport = () => {
    const jsonStr = JSON.stringify(metrics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mantine-benchmark.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper 
      shadow="xl" 
      p="md" 
      withBorder 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: 'var(--mantine-color-dark-8)',
        zIndex: 1000
      }}
    >
      <Group justify="space-between" mb="md">
        <Title order={5} c="blue.4">Benchmark Analyzer</Title>
        <Button 
          size="xs" 
          variant="light" 
          color="blue" 
          leftSection={<IconDownload size={14} />}
          onClick={handleExport}
        >
          EXPORT BENCHMARK
        </Button>
      </Group>

      <SimpleGrid cols={2} spacing="xs">
        {Object.entries(metrics).map(([key, value]) => (
          <Box key={key} p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderRadius: '4px' }}>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '10px' }} title={key}>
              {key}
            </Text>
            <Text size="sm" fw={600} ff="monospace">
              {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Paper>
  );
}
