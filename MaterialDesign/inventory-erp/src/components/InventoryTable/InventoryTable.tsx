'use client';

import React, { useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox } from '@mui/material';
import { useInventory } from '@/store/InventoryContext';
import { InventoryRow } from './InventoryRow';

export function InventoryTable() {
  const { items, searchQuery, statusFilter, selectedIds, setSelectedIds } = useInventory();

  // Filter items based on search and status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const allSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredItems.length;

  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(filteredItems.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  }, [filteredItems, setSelectedIds]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev: string[]) => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  }, [setSelectedIds]);

  return (
    <TableContainer component={Paper} sx={{ maxHeight: '100%', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ width: 48 }}>
              <Checkbox
                color="primary"
                indeterminate={someSelected}
                checked={allSelected}
                onChange={handleSelectAll}
                size="small"
              />
            </TableCell>
            <TableCell sx={{ width: 120 }}>SKU_ID</TableCell>
            <TableCell>Nome do Item</TableCell>
            <TableCell sx={{ width: 150 }}>Categoria</TableCell>
            <TableCell align="right" sx={{ width: 100 }}>Estoque</TableCell>
            <TableCell align="right" sx={{ width: 100 }}>Preço Unit.</TableCell>
            <TableCell sx={{ width: 100 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredItems.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
          {filteredItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                Nenhum item encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
