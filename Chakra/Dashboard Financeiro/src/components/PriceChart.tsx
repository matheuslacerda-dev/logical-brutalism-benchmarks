'use client';
import { Box, Text, Spinner, Flex } from '@chakra-ui/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface ChartDataPoint {
  date: string;
  close: number;
}

interface PriceChartProps {
  symbol: string;
  data: ChartDataPoint[];
  isLoading: boolean;
  isPositive: boolean;
}

import { useEffect, useRef } from 'react';

export function PriceChart({ symbol, data, isLoading, isPositive }: PriceChartProps) {
  const renderStartTime = useRef(0);
  renderStartTime.current = performance.now();

  useEffect(() => {
    const duration = performance.now() - renderStartTime.current;
    try {
      performance.measure(`chart-render-${symbol}`, { start: renderStartTime.current, duration });
    } catch(e) {}
  });

  const color = isPositive ? '#48BB78' : '#F56565'; // green.400 or red.400

  if (isLoading) {
    return (
      <Flex w="full" h="400px" align="center" justify="center" bg="whiteAlpha.50" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.100" backdropFilter="blur(10px)">
        <Spinner size="xl" color="blue.400" thickness="4px" speed="0.65s" />
      </Flex>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Flex w="full" h="400px" align="center" justify="center" bg="whiteAlpha.50" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.100" backdropFilter="blur(10px)">
        <Text color="gray.400" fontWeight="medium">Nenhum dado disponível para o ativo {symbol}</Text>
      </Flex>
    );
  }

  const minPrice = Math.min(...data.map(d => d.close));
  const maxPrice = Math.max(...data.map(d => d.close));
  const domainPadding = (maxPrice - minPrice) * 0.1;

  return (
    <Box w="full" h="450px" p={6} bg="whiteAlpha.50" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.200" backdropFilter="blur(10px)" boxShadow="2xl">
      <Text fontSize="2xl" fontWeight="black" color="white" mb={6} letterSpacing="tight">Histórico de Preços - {symbol}</Text>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={[minPrice - domainPadding, maxPrice + domainPadding]} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #2D3748', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
            itemStyle={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}
            labelStyle={{ color: '#A0AEC0', marginBottom: '8px', fontSize: '14px', fontWeight: 'medium' }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Preço de Fechamento']}
          />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke={color} 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
