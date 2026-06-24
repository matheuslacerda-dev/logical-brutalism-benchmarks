'use client'

import { useMemo, useEffect } from 'react'
import { Box, Text, Icon } from '@chakra-ui/react'
import { useInventoryStore } from '../store/useInventoryStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingDown } from 'lucide-react'

export const AnalyticsPanel = () => {
  const items = useInventoryStore(state => state.items)
  const orders = useInventoryStore(state => state.orders)

  const data = useMemo(() => {
    if (typeof window !== 'undefined') {
      performance.mark('chart-mutation-start')
    }

    // Calcular "Demanda" baseada nos pedidos acumulados por categoria
    const demandByCategory: Record<string, number> = {}

    // Inicializar categorias com 0
    Object.values(items).forEach(item => {
      if (!demandByCategory[item.category]) {
        demandByCategory[item.category] = 0
      }
    })

    // Somar demanda
    orders.forEach(order => {
      const item = items[order.skuId]
      if (item) {
        demandByCategory[item.category] += order.qty
      }
    })

    // Se ainda não houver pedidos suficientes, gerar uma demanda baseada em estoque baixo para ter dados visuais
    const isOrdersEmpty = orders.length === 0
    if (isOrdersEmpty) {
       Object.values(items).forEach(item => {
         // Fictício apenas para inicialização bonita
         demandByCategory[item.category] = Math.max(0, 100 - item.quantity)
       })
    }

    // Ordenar e pegar as Top 3
    const sorted = Object.entries(demandByCategory)
      .map(([category, demand]) => ({ name: category, demand }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 3)

    if (typeof window !== 'undefined') {
      performance.mark('chart-mutation-end')
      try {
        performance.measure('Chart Mutation', 'chart-mutation-start', 'chart-mutation-end')
      } catch {}
    }
    return sorted
  }, [items, orders])

  useEffect(() => {
    performance.mark('chart-render-start')
    return () => {
      performance.mark('chart-render-end')
      try {
        performance.measure('Chart Render', 'chart-render-start', 'chart-render-end')
      } catch {}
    }
  })

  return (
    <Box bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" p={4} h="100%">
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Icon as={TrendingDown} color="orange.400" />
        <Text fontWeight="bold" fontSize="lg">Giro de Estoque (Top 3)</Text>
      </Box>
      <Box h="200px" w="100%">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#A0AEC0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#A0AEC0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
              contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', color: '#fff', borderRadius: '8px' }} 
            />
            <Bar dataKey="demand" radius={[4, 4, 0, 0]} animationDuration={500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#DD6B20' : index === 1 ? '#ED8936' : '#F6AD55'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
