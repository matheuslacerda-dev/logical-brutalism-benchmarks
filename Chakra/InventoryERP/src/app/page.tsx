'use client'

import { Box, Grid, GridItem, Heading, HStack, Input, Select, Button, Icon } from '@chakra-ui/react'
import { ShoppingBag, Zap } from 'lucide-react'
import { useInventoryStore } from '../store/useInventoryStore'
import { InventoryTable } from '../components/InventoryTable'
import { OrderTicker } from '../components/OrderTicker'
import { AnalyticsPanel } from '../components/AnalyticsPanel'
import { BenchmarkAnalyzer } from '../components/BenchmarkAnalyzer'
import { useEffect } from 'react'

if (typeof window !== 'undefined' && !performance.getEntriesByName('dashboard-mount-start').length) {
  performance.mark('dashboard-mount-start')
}

export default function Dashboard() {
  const setSearchQuery = useInventoryStore(state => state.setSearchQuery)
  const setStatusFilter = useInventoryStore(state => state.setStatusFilter)
  const batchOrderAction = useInventoryStore(state => state.batchOrderAction)

  useEffect(() => {
    performance.mark('dashboard-mount-end')
    try {
      performance.measure('Dashboard Mount', 'dashboard-mount-start', 'dashboard-mount-end')
    } catch {}
  }, [])

  return (
    <Box minH="100vh" p={6} bg="gray.900" color="white">
      <HStack mb={8} justify="space-between" align="center">
        <HStack gap={3}>
          <Icon as={ShoppingBag} w={8} h={8} color="blue.400" />
          <Heading size="lg" tracking="tight">Chakra UI - InventoryERP</Heading>
        </HStack>
        
        <HStack gap={4} bg="gray.800" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.700">
          <Input 
            placeholder="Buscar SKU ou Nome..." 
            w="250px" 
            variant="filled" 
            bg="gray.700" 
            _hover={{ bg: 'gray.600' }}
            _focus={{ bg: 'gray.600', borderColor: 'blue.400' }}
            onChange={(e) => setSearchQuery(e.target.value)}
            // icon={<Search />}
          />
          <Select 
            w="150px" 
            variant="filled" 
            bg="gray.700"
            _hover={{ bg: 'gray.600' }}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="" style={{ background: '#2D3748' }}>Todos Status</option>
            <option value="Disponível" style={{ background: '#2D3748' }}>Disponível</option>
            <option value="Crítico" style={{ background: '#2D3748' }}>Crítico</option>
            <option value="Esgotado" style={{ background: '#2D3748' }}>Esgotado</option>
          </Select>
          <Button 
            colorScheme="blue" 
            leftIcon={<Zap size={16} />} 
            onClick={batchOrderAction}
          >
            Ação em Lote (Repor Selecionados)
          </Button>
        </HStack>
      </HStack>

      <Grid templateColumns="repeat(12, 1fr)" gap={6} h="calc(100vh - 120px)">
        <GridItem colSpan={9} display="flex" flexDir="column" gap={6}>
          <Box flex={1} minH={0}>
            <InventoryTable />
          </Box>
        </GridItem>
        <GridItem colSpan={3} display="flex" flexDir="column" gap={6}>
          <Box flex="0 0 300px">
            <AnalyticsPanel />
          </Box>
          <Box flex={1} minH={0}>
            <OrderTicker />
          </Box>
        </GridItem>
      </Grid>
      <BenchmarkAnalyzer />
    </Box>
  )
}
