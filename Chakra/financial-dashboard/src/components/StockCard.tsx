'use client';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Flex, Text } from '@chakra-ui/react';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  onClick: () => void;
  isActive: boolean;
}

import { useEffect, useRef } from 'react';

export function StockCard({ symbol, name, price, change, changePercent, onClick, isActive }: StockCardProps) {
  const renderStartTime = useRef(0);
  renderStartTime.current = performance.now();

  useEffect(() => {
    const duration = performance.now() - renderStartTime.current;
    try {
      performance.measure(`widget-render-${symbol}`, { start: renderStartTime.current, duration });
    } catch(e) {}
  });

  // Garante que os números são válidos
  const safePrice = price || 0;
  const safeChange = change || 0;
  const safeChangePercent = changePercent || 0;
  
  const isPositive = safeChange >= 0;
  
  return (
    <Box
      as="button"
      onClick={onClick}
      w="full"
      textAlign="left"
      p={5}
      borderRadius="2xl"
      bg={isActive ? 'whiteAlpha.200' : 'whiteAlpha.50'}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={isActive ? 'blue.400' : 'whiteAlpha.200'}
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-4px)', boxShadow: '2xl' }}
      boxShadow="xl"
    >
      <Stat>
        <Flex justify="space-between" align="center" mb={3}>
          <StatLabel fontSize="xl" fontWeight="bold" color="white" letterSpacing="tight">{symbol}</StatLabel>
          <Text fontSize="xs" color="gray.400" noOfLines={1} maxW="100px" fontWeight="medium">{name}</Text>
        </Flex>
        <StatNumber fontSize="4xl" fontWeight="black" color="white" letterSpacing="tighter">
          ${safePrice.toFixed(2)}
        </StatNumber>
        <StatHelpText mb={0} display="flex" alignItems="center" fontSize="md" mt={2} bg={isPositive ? 'green.500' : 'red.500'} color="white" w="max-content" px={2} py={1} borderRadius="md" fontWeight="bold">
          <StatArrow type={isPositive ? 'increase' : 'decrease'} color="white" />
          <Text>
            {Math.abs(safeChange).toFixed(2)} ({Math.abs(safeChangePercent).toFixed(2)}%)
          </Text>
        </StatHelpText>
      </Stat>
    </Box>
  );
}
