import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Badge,
  Flex
} from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BenchmarkAnalyzer from './BenchmarkAnalyzer';

const generateInitialData = () => {
  const data = [];
  for (let i = 0; i < 100; i++) {
    const bid = Math.random() * 1000 + 100;
    const ask = bid + Math.random() * 5 + 0.1;
    data.push({
      id: i,
      symbol: `TICKER-${i.toString().padStart(3, '0')}`,
      bid: bid,
      ask: ask,
      volume: Math.floor(Math.random() * 100000),
      status: 'ACTIVE',
      direction: null, // 'up' | 'down' | null
    });
  }
  return data;
};

export default function App() {
  const [orderBook, setOrderBook] = useState(generateInitialData());
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    performance.mark('dashboard-mount-start');
    requestAnimationFrame(() => {
      performance.mark('dashboard-mount-end');
    });
  }, []);

  useEffect(() => {
    // Inicializa métricas globais simuladas
    window.__WS_MESSAGES__ = 0;
    window.__WS_RECEIVED_MB__ = 0;

    // Simula a conexão WebSocket disparando a cada 50ms
    const interval = setInterval(() => {
      performance.mark('widget-update-start');
      performance.mark('chart-update-start');

      // Atualiza o gráfico fake
      setChartData((prev) => {
        const newData = [...prev.slice(-19), { time: new Date().toLocaleTimeString(), value: Math.random() * 1000 }];
        return newData;
      });

      setOrderBook((prevBook) => {
        // Criando cópia do array para atualizar o estado de forma imutável, 
        // mas sem otimizações extremas para forçar o diffing do React.
        const newBook = [...prevBook];
        
        // Define entre 10 e 20 linhas para serem atualizadas
        const numUpdates = Math.floor(Math.random() * 11) + 10;
        
        const simulatedPayload = [];
        for (let i = 0; i < numUpdates; i++) {
          const randomIndex = Math.floor(Math.random() * 100);
          const row = newBook[randomIndex];
          
          const change = (Math.random() * 10) - 5; // Variação de -5 a +5
          const newBid = Math.max(0.01, row.bid + change);
          const newAsk = newBid + Math.random() * 5 + 0.1;
          
          const updatedRow = {
            ...row,
            bid: newBid,
            ask: newAsk,
            volume: row.volume + Math.floor(Math.random() * 500),
            direction: change > 0 ? 'up' : 'down'
          };
          
          newBook[randomIndex] = updatedRow;
          simulatedPayload.push(updatedRow);
        }
        
        // Calcula o peso real e exato em bytes do payload que seria recebido, sem usar "mock" arbitrário
        const payloadSizeBytes = new Blob([JSON.stringify(simulatedPayload)]).size;
        window.__WS_MESSAGES__ += 1;
        window.__WS_RECEIVED_MB__ += payloadSizeBytes / (1024 * 1024);
        
        return newBook;
      });

      // Mede o fim do ciclo de atualização logo após a renderização atual
      requestAnimationFrame(() => {
        performance.mark('widget-update-end');
        performance.mark('chart-update-end');
        try {
          performance.measure('widget-update', 'widget-update-start', 'widget-update-end');
          performance.measure('chart-update', 'chart-update-start', 'chart-update-end');
        } catch(e) {}
      });

    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <ChakraProvider>
      <Box p={6} bg="gray.100" minH="100vh">
        <Card shadow="lg" borderTop="4px solid" borderTopColor="blue.500">
          <CardHeader borderBottom="1px solid" borderColor="gray.200" pb={4}>
            <Flex justify="space-between" align="center">
              <Heading size="lg" color="gray.700">Chakra UI B2B Order Book Dashboard</Heading>
              <Flex gap={3} align="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.500">
                  Live Updates
                </Text>
                <Badge 
                  colorScheme="green" 
                  variant="solid" 
                  px={2} 
                  py={1} 
                  borderRadius="md"
                >
                  WebSocket: 50ms tick
                </Badge>
              </Flex>
            </Flex>
          </CardHeader>
          
          <CardBody px={0} py={0}>
            {/* Gráfico Fake de Benchmark */}
            <Box h="200px" p={4} borderBottom="1px solid" borderColor="gray.100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3182ce" strokeWidth={2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Tabela com scroll interno para aguentar as 100 linhas densas */}
            <TableContainer maxH="55vh" overflowY="auto">
              <Table variant="simple" colorScheme="gray" size="sm">
                <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                  <Tr>
                    <Th>Symbol</Th>
                    <Th isNumeric>Bid Price</Th>
                    <Th isNumeric>Ask Price</Th>
                    <Th isNumeric>Volume</Th>
                    <Th textAlign="center">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orderBook.map((row) => (
                    <Tr key={row.id}>
                      <Td>
                        <Text fontWeight="bold" color="blue.600">
                          {row.symbol}
                        </Text>
                      </Td>
                      
                      {/* Células que piscam de acordo com a variação usando props nativas */}
                      <Td 
                        isNumeric 
                        fontWeight="medium"
                        bg={row.direction === 'up' ? 'green.100' : row.direction === 'down' ? 'red.100' : 'transparent'}
                        color={row.direction === 'up' ? 'green.800' : row.direction === 'down' ? 'red.800' : 'inherit'}
                        transition="background-color 0.1s ease-in-out"
                      >
                        {row.bid.toFixed(2)}
                      </Td>
                      
                      <Td 
                        isNumeric
                        fontWeight="medium"
                        bg={row.direction === 'up' ? 'green.100' : row.direction === 'down' ? 'red.100' : 'transparent'}
                        color={row.direction === 'up' ? 'green.800' : row.direction === 'down' ? 'red.800' : 'inherit'}
                        transition="background-color 0.1s ease-in-out"
                      >
                        {row.ask.toFixed(2)}
                      </Td>
                      
                      <Td isNumeric>
                        {row.volume.toLocaleString()}
                      </Td>
                      
                      <Td textAlign="center">
                        <Badge 
                          colorScheme={row.status === 'ACTIVE' ? 'blue' : 'gray'} 
                          variant="subtle"
                        >
                          {row.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </Box>
      <BenchmarkAnalyzer />
    </ChakraProvider>
  );
}
