'use client'

import { useEffect, useMemo } from 'react'
import { Table, Thead, Tbody, Tr, Th, TableContainer, Box, Text } from '@chakra-ui/react'
import { useInventoryStore } from '../store/useInventoryStore'
import { InventoryRow } from './InventoryRow'

export const InventoryTable = () => {
  const itemIds = useInventoryStore((state) => state.itemIds)
  const searchQuery = useInventoryStore((state) => state.searchQuery)
  const statusFilter = useInventoryStore((state) => state.statusFilter)
  const items = useInventoryStore((state) => state.items)

  // Filtro de alto desempenho sem forçar rerender dos filhos. 
  // O estado de items para filtragem é reativo, mas o InventoryRow gerencia o próprio conteúdo interno.
  const filteredIds = useMemo(() => {
    return itemIds.filter(id => {
      const item = items[id]
      if (!item) return false

      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter ? item.status === statusFilter : true

      return matchesSearch && matchesStatus
    })
  }, [itemIds, searchQuery, statusFilter, items])

  // Hook de Performance para montar a tabela
  useEffect(() => {
    performance.mark('table-render-start')
    
    return () => {
      performance.mark('table-render-end')
      try {
        performance.measure('Tabela Render', 'table-render-start', 'table-render-end')
      } catch {
        // Ignorar erros caso a mark não exista
      }
    }
  })

  return (
    <Box bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" overflow="hidden">
      <TableContainer>
        <Table size="sm" variant="simple" colorScheme="whiteAlpha">
          <Thead bg="gray.900">
            <Tr>
              <Th w="40px"></Th>
              <Th>SKU ID</Th>
              <Th>Nome do Item</Th>
              <Th>Categoria</Th>
              <Th isNumeric>Estoque</Th>
              <Th isNumeric>Preço Unitário</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredIds.length === 0 ? (
              <Tr>
                <Th colSpan={7} textAlign="center" py={4} color="gray.400">
                  <Text>Nenhum item encontrado.</Text>
                </Th>
              </Tr>
            ) : (
              filteredIds.map(id => (
                <InventoryRow key={id} skuId={id} />
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  )
}
