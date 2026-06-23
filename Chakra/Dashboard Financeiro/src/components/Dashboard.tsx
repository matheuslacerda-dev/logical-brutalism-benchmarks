'use client';
import { useState, useEffect, useRef } from 'react';
import { Container, SimpleGrid, Heading, VStack, Flex, Text, Button, ButtonGroup, Icon, Box } from '@chakra-ui/react';
import useSWR from 'swr';
import { StockCard } from './StockCard';
import { PriceChart } from './PriceChart';
import { FaChartLine, FaSyncAlt } from 'react-icons/fa';

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'PETR4.SA', 'VALE3.SA', '^BVSP'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOLS[0]);
  const [range, setRange] = useState('1mo');

  // Real-time market data (poll every 5 seconds)
  const { data: quotes, isValidating } = useSWR(
    `/api/market?symbols=${DEFAULT_SYMBOLS.join(',')}`,
    fetcher,
    { refreshInterval: 5000, keepPreviousData: true }
  );

  // Historical data for selected symbol
  const { data: history, isLoading: historyLoading } = useSWR(
    `/api/history?symbol=${selectedSymbol}&range=${range}`,
    fetcher
  );

  const quotesArray = Array.isArray(quotes) ? quotes : [];
  const selectedQuote = quotesArray.find((q: any) => q.symbol === selectedSymbol);
  const isPositive = selectedQuote ? (selectedQuote.regularMarketChange >= 0) : true;

  const chartData = history?.quotes?.map((q: any) => ({
    date: new Date(q.date).toLocaleDateString(),
    close: q.close
  })).filter((q: any) => q.close !== null) || [];

  const ranges = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '1A', value: '1y' },
  ];

  const mountStart = useRef(performance.now());
  const mounted = useRef(false);
  
  useEffect(() => {
    if (!mounted.current) {
      try {
        performance.measure('dashboard-mount', { start: mountStart.current, duration: performance.now() - mountStart.current });
      } catch(e) {}
      mounted.current = true;
    }
  }, []);

  const updateRef = useRef(performance.now());
  useEffect(() => {
    if (mounted.current) {
      const now = performance.now();
      try {
        performance.measure('dashboard-update', { start: updateRef.current, duration: now - updateRef.current });
      } catch(e) {}
      updateRef.current = now;
    }
  }, [quotes]);

  return (
    <Box minH="100vh" bg="gray.900" 
      bgImage="radial-gradient(circle at 50% 0%, rgba(43, 108, 176, 0.2) 0%, transparent 60%)"
      pt={10} pb={20}>
      <Container maxW="container.xl">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={12} direction={{ base: 'column', md: 'row' }} gap={4}>
          <Flex align="center" gap={4}>
            <Box p={4} bg="blue.500" borderRadius="2xl" boxShadow="0 0 30px rgba(66, 153, 225, 0.4)">
              <Icon as={FaChartLine} color="white" boxSize={8} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="xl" color="white" letterSpacing="tight">Chakra Design System</Heading>
              <Text color="blue.200" fontSize="md" fontWeight="medium">Mercado em Tempo Real</Text>
            </VStack>
          </Flex>
          
          <Flex align="center" gap={3} px={5} py={2} bg="whiteAlpha.100" borderRadius="full" backdropFilter="blur(10px)" border="1px solid" borderColor="whiteAlpha.200" boxShadow="lg">
            <Icon 
              as={FaSyncAlt} 
              color={isValidating ? "blue.400" : "green.400"} 
              animation={isValidating ? "spin 1s linear infinite" : "none"} 
            />
            <Text fontSize="sm" fontWeight="bold" color="white">
              {isValidating ? "Atualizando..." : "Conectado"}
            </Text>
          </Flex>
        </Flex>

        {/* Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={12}>
          {quotesArray.length > 0 ? quotesArray.map((quote: any) => (
            <StockCard
              key={quote.symbol}
              symbol={quote.symbol}
              name={quote.shortName || quote.longName || quote.symbol}
              price={quote.regularMarketPrice}
              change={quote.regularMarketChange}
              changePercent={quote.regularMarketChangePercent}
              isActive={selectedSymbol === quote.symbol}
              onClick={() => setSelectedSymbol(quote.symbol)}
            />
          )) : Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} h="140px" bg="whiteAlpha.50" borderRadius="2xl" backdropFilter="blur(5px)" border="1px solid" borderColor="whiteAlpha.100" />
          ))}
        </SimpleGrid>

        {/* Chart Area */}
        <Box>
          <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
            <Heading size="lg" color="white" letterSpacing="tight">
              Análise Detalhada: <Text as="span" color="blue.400">{selectedSymbol}</Text>
            </Heading>
            <ButtonGroup size="md" isAttached variant="outline" bg="whiteAlpha.50" borderRadius="xl" p={1}>
              {ranges.map((r) => (
                <Button 
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  isActive={range === r.value}
                  _active={{ bg: 'blue.500', color: 'white', borderColor: 'blue.500', borderRadius: 'lg' }}
                  borderColor="transparent"
                  color="gray.300"
                  _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                  fontWeight="bold"
                >
                  {r.label}
                </Button>
              ))}
            </ButtonGroup>
          </Flex>
          
          <PriceChart 
            symbol={selectedSymbol} 
            data={chartData} 
            isLoading={historyLoading} 
            isPositive={isPositive} 
          />
        </Box>
      </Container>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
