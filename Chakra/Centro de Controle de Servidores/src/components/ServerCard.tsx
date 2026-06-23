import { memo, useEffect } from 'react';
import { Box, Flex, Text, Badge, VStack, HStack, Icon } from '@chakra-ui/react';
import { ServerState } from '../types';
import { Server } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface ServerCardProps {
  server: ServerState;
  onClick: (id: string) => void;
  isSelected: boolean;
}

const statusColors = {
  ONLINE: 'green',
  OVERLOAD: 'red',
  IDLE: 'gray',
};

const ServerCard = memo(({ server, onClick, isSelected }: ServerCardProps) => {
  useEffect(() => {
    // Fire only once when mounted
    if (performance.getEntriesByName('widget-initial-render-start').length === 0) {
      performance.mark('widget-initial-render-start');
      requestAnimationFrame(() => {
        performance.mark('widget-initial-render-end');
        performance.measure('widget-initial-render', 'widget-initial-render-start', 'widget-initial-render-end');
      });
    }
  }, []);

  return (
    <Box
      borderWidth="1px"
      borderColor={isSelected ? 'blue.500' : 'gray.700'}
      borderRadius="lg"
      p={4}
      bg="gray.800"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)' }}
      onClick={() => onClick(server.id)}
      boxShadow={isSelected ? '0 0 0 1px #3182ce' : 'none'}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Icon as={Server} color="blue.400" />
          <Text fontWeight="bold" color="white">{server.name}</Text>
        </HStack>
        <Badge colorScheme={statusColors[server.status]} variant="solid">
          {server.status}
        </Badge>
      </Flex>
      
      <Flex justify="space-between" mb={2}>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color="gray.400">PID</Text>
          <Text fontSize="sm" fontFamily="mono" color="gray.200">{server.pid}</Text>
        </VStack>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color="gray.400">CPU</Text>
          <Text fontSize="sm" fontWeight="bold" color={server.cpu > 80 ? 'red.300' : 'green.300'}>
            {server.cpu}%
          </Text>
        </VStack>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color="gray.400">RAM</Text>
          <Text fontSize="sm" fontWeight="bold" color={server.ram > 80 ? 'red.300' : 'green.300'}>
            {server.ram}%
          </Text>
        </VStack>
      </Flex>

      <Box h="40px" w="100%" mt={4}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={server.history}>
            <YAxis domain={[0, 100]} hide />
            <Line type="monotone" dataKey="cpu" stroke="#3182ce" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="ram" stroke="#805ad5" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

ServerCard.displayName = 'ServerCard';
export default ServerCard;
