import { memo, useMemo, useEffect } from 'react';
import { Box, Text, Flex, Badge, Heading } from '@chakra-ui/react';
import { ServerState } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ServerDetailsPanelProps {
  server: ServerState | null;
}

const ServerDetailsPanel = memo(({ server }: ServerDetailsPanelProps) => {
  useEffect(() => {
    if (server && performance.getEntriesByName('chart-initial-render-start').length === 0) {
      performance.mark('chart-initial-render-start');
      requestAnimationFrame(() => {
        performance.mark('chart-initial-render-end');
        performance.measure('chart-initial-render', 'chart-initial-render-start', 'chart-initial-render-end');
      });
    }
  }, [server]);

  const chartData = useMemo(() => {
    if (!server) return [];
    return server.history;
  }, [server]);

  if (!server) {
    return (
      <Box p={6} bg="gray.800" borderRadius="lg" h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500">Selecione um servidor para ver os detalhes (Últimas 24h)</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.800" borderRadius="lg" h="100%" display="flex" flexDirection="column">
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="md" color="white">{server.name}</Heading>
          <Text fontSize="sm" color="gray.400" mt={1}>Process ID: {server.pid}</Text>
        </Box>
        <Badge colorScheme={server.status === 'ONLINE' ? 'green' : server.status === 'OVERLOAD' ? 'red' : 'gray'} p={2} borderRadius="md">
          {server.status}
        </Badge>
      </Flex>

      <Box flex="1" w="100%" minH="250px">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3182ce" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#805ad5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#805ad5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" vertical={false} />
            <XAxis dataKey="time" stroke="#A0AEC0" tick={{fontSize: 12}} />
            <YAxis stroke="#A0AEC0" tick={{fontSize: 12}} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', color: '#fff' }}
              itemStyle={{ color: '#E2E8F0' }}
            />
            <Area type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="#3182ce" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
            <Area type="monotone" dataKey="ram" name="RAM Usage (%)" stroke="#805ad5" fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

ServerDetailsPanel.displayName = 'ServerDetailsPanel';
export default ServerDetailsPanel;
