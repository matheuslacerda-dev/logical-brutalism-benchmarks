import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Table, Card, Text, Badge, Container, Title, Group, Paper } from '@mantine/core';
import { BenchmarkAnalyzer } from './BenchmarkAnalyzer';

const generateInitialData = (count = 100) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      symbol: `SYM-${1000 + i}`,
      price: Math.random() * 1000 + 50,
      amount: Math.random() * 100,
      status: 'none' // 'up', 'down', 'none'
    });
  }
  return data;
};

export default function App() {
  const [data, setData] = useState(() => generateInitialData(100));
  
  // Benchmark Tracking
  const [wsMessages, setWsMessages] = useState(0);
  const [wsMutatedBytes, setWsMutatedBytes] = useState(0);
  
  const updateMarkId = useRef(0);
  const mountMarked = useRef(false);

  if (!mountMarked.current && performance.getEntriesByName('dashboard-mount-start').length === 0) {
    performance.mark('dashboard-mount-start');
    mountMarked.current = true;
  }

  // Monitoramento do ciclo de vida React
  const renderStartMark = `widget-render-start-${Date.now()}`;
  performance.mark(renderStartMark);

  useLayoutEffect(() => {
    if (performance.getEntriesByName('dashboard-mount').length === 0) {
      performance.mark('dashboard-mount-end');
      try {
        performance.measure('dashboard-mount', 'dashboard-mount-start', 'dashboard-mount-end');
      } catch (e) {}
    } else {
      const renderEndMark = `widget-render-end-${Date.now()}`;
      performance.mark(renderEndMark);
      try {
        performance.measure('widget-update', renderStartMark, renderEndMark);
      } catch (e) {}
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Mark the start of the data mutation and render cycle
      updateMarkId.current++;
      performance.mark(`widget-update-start-${updateMarkId.current}`);

      setData((prevData) => {
        const numMutations = Math.floor(Math.random() * 11) + 10; 
        const indicesToMutate = new Set<number>();
        while (indicesToMutate.size < numMutations) {
          indicesToMutate.add(Math.floor(Math.random() * prevData.length));
        }

        let bytesMutated = 0;

        const newData = prevData.map((row, index) => {
          if (indicesToMutate.has(index)) {
            const change = (Math.random() - 0.5) * 10; 
            const newPrice = Math.max(0, row.price + change);
            
            const payload = JSON.stringify({ id: row.id, price: newPrice, status: change >= 0 ? 'up' : 'down' });
            bytesMutated += new Blob([payload]).size;

            return {
              ...row,
              price: newPrice,
              status: change >= 0 ? 'up' : 'down',
            };
          }
          return {
             ...row,
             status: 'none'
          };
        });
        
        setWsMessages(prev => prev + 1);
        setWsMutatedBytes(prev => prev + bytesMutated);
        
        return newData;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Container size="xl" py="xl" pb={120}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={2} c="blue.7">Mantine Design System - Order Book</Title>
            <Badge color="blue" variant="light" size="lg">
              Live Updates (50ms)
            </Badge>
          </Group>

          <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Symbol</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Trend</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((row) => {
                  let bgProp = undefined;
                  let textColor = undefined;
                  
                  if (row.status === 'up') {
                    bgProp = 'green.1';
                    textColor = 'green.9';
                  } else if (row.status === 'down') {
                    bgProp = 'red.1';
                    textColor = 'red.9';
                  }

                  return (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{row.id}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{row.symbol}</Text>
                      </Table.Td>
                      <Table.Td bg={bgProp} style={{ transition: 'background-color 0.1s ease-in-out' }}>
                        <Text fw={700} c={textColor}>
                          ${row.price.toFixed(2)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{row.amount.toFixed(4)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          ${(row.price * row.amount).toFixed(2)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {row.status !== 'none' && (
                          <Badge color={row.status === 'up' ? 'green' : 'red'} size="sm" variant="filled">
                            {row.status === 'up' ? '▲ UP' : '▼ DOWN'}
                          </Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        </Card>
      </Container>
      
      <ChartSimulator data={data} />
      {/* O monitor de benchmark fixo na tela */}
      <BenchmarkAnalyzer wsMessages={wsMessages} wsDataMutatedBytes={wsMutatedBytes} />
    </>
  );
}

function ChartSimulator({ data }: { data: any }) {
  const chartStartMark = `chart-render-start-${Date.now()}`;
  performance.mark(chartStartMark);

  useLayoutEffect(() => {
    if (performance.getEntriesByName('charts-render-mount').length === 0) {
      performance.mark('charts-render-end');
      try {
        performance.measure('charts-render-mount', 'dashboard-mount-start', 'charts-render-end');
      } catch (e) {}
    } else {
      const chartEndMark = `chart-render-end-${Date.now()}`;
      performance.mark(chartEndMark);
      try {
        performance.measure('chart-update', chartStartMark, chartEndMark);
      } catch(e) {}
    }
  });

  // Simula um componente pesado/chart
  const x = data.length > 0 ? Array.from({ length: 1000 }).map(() => Math.random()) : [];

  return (
    <div style={{ display: 'none' }}>{x.length}</div>
  );
}
