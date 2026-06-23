'use client';

import React from 'react';
import { Box, TextField, Button, ButtonGroup, InputAdornment, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { useInventory } from '@/store/InventoryContext';

export function ActionBar() {
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, selectedIds, batchActionAction } = useInventory();

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder="Buscar SKU ou Nome..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }
        }}
        sx={{ width: 300 }}
      />

      <ButtonGroup size="small" variant="outlined" aria-label="Status Filters">
        <Button
          variant={statusFilter === null ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter(null)}
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === 'Disponível' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('Disponível')}
          color="success"
        >
          Disponível
        </Button>
        <Button
          variant={statusFilter === 'Crítico' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('Crítico')}
          color="warning"
        >
          Crítico
        </Button>
        <Button
          variant={statusFilter === 'Esgotado' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('Esgotado')}
          color="error"
        >
          Esgotado
        </Button>
      </ButtonGroup>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {selectedIds.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {selectedIds.length} item(s) selecionado(s)
          </Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingCartCheckoutIcon />}
          disabled={selectedIds.length === 0}
          onClick={batchActionAction}
        >
          Disparar Ordem de Compra
        </Button>
      </Box>
    </Box>
  );
}
