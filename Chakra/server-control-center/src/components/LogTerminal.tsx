import { memo, useEffect, useRef } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

interface LogTerminalProps {
  logs: string[];
}

const LogTerminal = memo(({ logs }: LogTerminalProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <Box 
      bg="black" 
      color="green.400" 
      fontFamily="mono" 
      p={4} 
      borderRadius="md" 
      h="250px" 
      overflowY="auto"
      boxShadow="inner"
      borderWidth="1px"
      borderColor="gray.700"
    >
      <VStack align="stretch" spacing={1}>
        {logs.map((log, index) => {
          let color = 'green.400';
          if (log.includes('WARN')) color = 'yellow.400';
          if (log.includes('ERR')) color = 'red.400';
          if (log.includes('INFO')) color = 'blue.300';

          return (
            <Text key={index} fontSize="sm" color={color} whiteSpace="pre-wrap">
              {log}
            </Text>
          );
        })}
        <div ref={bottomRef} />
      </VStack>
    </Box>
  );
});

LogTerminal.displayName = 'LogTerminal';
export default LogTerminal;
