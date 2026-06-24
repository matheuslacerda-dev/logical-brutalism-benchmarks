'use client';

import React, { memo, useEffect } from 'react';
import { TableRow, TableCell, Checkbox, Chip, Typography, Box } from '@mui/material';
import { InventoryItem } from '@/types/inventory';

interface InventoryRowProps {
  item: InventoryItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const StatusColors = {
  Disponível: 'success',
  Crítico: 'warning',
  Esgotado: 'error',
} as const;

function InventoryRowComponent({ item, isSelected, onToggleSelect }: InventoryRowProps) {
  // Performance hook to measure row render time
  useEffect(() => {
    performance.mark(`row-render-start-${item.id}`);
    return () => {
      performance.mark(`row-render-end-${item.id}`);
      performance.measure(
        `Row Render ${item.name}`,
        `row-render-start-${item.id}`,
        `row-render-end-${item.id}`
      );
    };
  });

  return (
    <TableRow hover selected={isSelected}>
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {item.sku}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {item.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip size="small" label={item.category} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color={item.quantity === 0 ? 'text.secondary' : 'text.primary'} sx={{ fontWeight: item.quantity === 0 ? 400 : 700 }}>
          {item.quantity}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          ${item.price.toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={item.status}
          color={StatusColors[item.status]}
          size="small"
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
        />
      </TableCell>
    </TableRow>
  );
}

// React.memo with custom comparison to avoid re-renders unless data changes
export const InventoryRow = memo(InventoryRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.price === nextProps.item.price
    // Add other fields if they can mutate, but mostly it's quantity and status
  );
});
