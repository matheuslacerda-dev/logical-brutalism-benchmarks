'use client'

import { memo } from 'react'
import { Tr, Td, Checkbox, Badge, Text } from '@chakra-ui/react'
import { useInventoryStore } from '../store/useInventoryStore'

interface InventoryRowProps {
  skuId: string
}

// Row memoizado isoladamente. Ele consome o Zustand com seletor apenas para o seu ID.
export const InventoryRow = memo(function InventoryRow({ skuId }: InventoryRowProps) {
  const item = useInventoryStore((state) => state.items[skuId])
  const toggleSelection = useInventoryStore((state) => state.toggleSelection)

  if (!item) return null

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'green'
      case 'Crítico': return 'yellow'
      case 'Esgotado': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Tr
      _hover={{ bg: 'whiteAlpha.100' }}
      transition="background 0.2s"
    >
      <Td py={2}>
        <Checkbox
          colorScheme="blue"
          isChecked={!!item.selected}
          onChange={() => toggleSelection(skuId)}
        />
      </Td>
      <Td py={2} fontFamily="mono" fontSize="sm">{item.id}</Td>
      <Td py={2}><Text fontWeight="medium" noOfLines={1}>{item.name}</Text></Td>
      <Td py={2}>{item.category}</Td>
      <Td py={2} isNumeric>
        <Text fontWeight="bold" color={item.quantity <= 15 ? (item.quantity === 0 ? 'red.300' : 'yellow.300') : 'inherit'}>
          {item.quantity}
        </Text>
      </Td>
      <Td py={2} isNumeric>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
      </Td>
      <Td py={2}>
        <Badge colorScheme={getBadgeColor(item.status)} variant="subtle">
          {item.status}
        </Badge>
      </Td>
    </Tr>
  )
})
