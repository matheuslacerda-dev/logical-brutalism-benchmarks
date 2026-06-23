'use client';
import { useState, Profiler } from 'react';
import { AppShell, Container, Grid, Title, Text, Group, ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconChartBar } from '@tabler/icons-react';
import { StockCard } from './StockCard';
import { DetailedChart } from './DetailedChart';

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN'];

export function Dashboard() {
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_SYMBOLS[0]);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <IconChartBar size={30} color="var(--mantine-color-blue-filled)" />
            <Title order={3}>Mantine Design System</Title>
          </Group>
          <ActionIcon onClick={toggleColorScheme} variant="default" size="lg" aria-label="Toggle color scheme">
            {computedColorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" pt="md">
          <Grid>
            <Grid.Col span={12}>
              <Text size="xl" fw={700} mb="sm">Market Overview</Text>
              <Profiler id="WidgetsGrid" onRender={(id, phase, actualDuration) => {
                if (phase === 'mount') import('@/utils/benchmarkStore').then(m => m.benchmarkStore.update({ widgets_render_ms: Math.round(actualDuration) }));
              }}>
                <Grid>
                  {DEFAULT_SYMBOLS.map((symbol) => (
                    <Grid.Col key={symbol} span={{ base: 12, sm: 6, md: 4 }}>
                      <StockCard 
                        symbol={symbol} 
                        onClick={() => setActiveSymbol(symbol)}
                        active={activeSymbol === symbol}
                      />
                    </Grid.Col>
                  ))}
                </Grid>
              </Profiler>
            </Grid.Col>
            
            <Grid.Col span={12} mt="xl">
              <DetailedChart symbol={activeSymbol} />
            </Grid.Col>
          </Grid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
