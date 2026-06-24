'use client'

import { useEffect } from 'react'
import { Box, Text, VStack, HStack, Badge, Icon } from '@chakra-ui/react'
import { useInventoryStore } from '../store/useInventoryStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

export const OrderTicker = () => {
  const processOrder = useInventoryStore(state => state.processOrder)
  const itemIds = useInventoryStore(state => state.itemIds)
  const orders = useInventoryStore(state => state.orders)
  
  // Ticker Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // performance mark for mutation
      performance.mark('order-mutation-start')

      const randomSku = itemIds[Math.floor(Math.random() * itemIds.length)]
      const randomQty = Math.floor(Math.random() * 5) + 1 // 1 a 5 itens
      
      processOrder(randomSku, randomQty)

      performance.mark('order-mutation-end')
      try {
        performance.measure('Order Mutation', 'order-mutation-start', 'order-mutation-end')
        // console.log(performance.getEntriesByName('Order Mutation').pop())
      } catch {
        // Ignorar
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [itemIds, processOrder])

  return (
    <Box bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" h="100%" display="flex" flexDir="column">
      <Box p={4} borderBottomWidth="1px" borderColor="gray.700" display="flex" alignItems="center" gap={2}>
        <Icon as={ShoppingCart} color="blue.400" />
        <Text fontWeight="bold" fontSize="lg">Fluxo de Pedidos</Text>
      </Box>
      <Box flex={1} overflowY="hidden" position="relative" p={4}>
        <VStack spacing={3} align="stretch">
          <AnimatePresence initial={false}>
            {orders.slice(0, 10).map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Box p={3} bg="gray.700" borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.400">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="bold" color="blue.200">{order.skuId}</Text>
                    <Badge colorScheme="blue" variant="solid">-{order.qty} UN</Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    {new Date(order.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </VStack>
        
        {/* Gradient fade at bottom */}
        <Box 
          position="absolute" 
          bottom={0} 
          left={0} 
          right={0} 
          height="60px" 
          bgGradient="linear(to-b, transparent, gray.800)" 
          pointerEvents="none"
        />
      </Box>
    </Box>
  )
}
