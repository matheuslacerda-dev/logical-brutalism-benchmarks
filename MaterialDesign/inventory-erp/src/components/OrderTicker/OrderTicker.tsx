'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Divider, Fade, Chip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useInventory } from '@/store/InventoryContext';

export function OrderTicker() {
  const { items, orders, addOrder } = useInventory();
  const itemsRef = useRef(items);

  // Keep a ref to the latest items so the interval doesn't need to rebind and cause loops
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentItems = itemsRef.current;
      if (currentItems.length === 0) return;

      // Pick a random item
      const randomItem = currentItems[Math.floor(Math.random() * currentItems.length)];
      
      // Generate a random order quantity (e.g., between 1 and 5)
      // Usually reducing stock (simulating an outgoing order)
      const qtyChange = -Math.floor(Math.random() * 5 + 1);

      addOrder({
        id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        skuId: randomItem.id,
        quantityChange: qtyChange,
        timestamp: new Date(),
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [addOrder]);

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.02)' }}>
        <LocalShippingIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Fluxo de Pedidos
        </Typography>
        <Chip size="small" label="Ao vivo" color="error" variant="outlined" sx={{ ml: 'auto', height: 20, fontSize: '0.65rem' }} />
      </Box>
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {orders.map((order, index) => {
          const item = itemsRef.current.find(i => i.id === order.skuId);
          return (
            <Fade in={true} key={order.id} timeout={500}>
              <Box>
                <ListItem sx={{ py: 1.5, px: 2 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="primary.light" sx={{ fontWeight: 600 }}>
                          {order.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {item?.sku || order.skuId}
                        </Typography>
                        <Typography component="span" variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                          {order.quantityChange} uni.
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < orders.length - 1 && <Divider component="li" />}
              </Box>
            </Fade>
          );
        })}
        {orders.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aguardando novos pedidos...
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
}
