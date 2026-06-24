'use client';

import React, { useMemo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useInventory } from '@/store/InventoryContext';
import InsightsIcon from '@mui/icons-material/Insights';

export function TurnoverChart() {
  const { items } = useInventory();

  // Calculate demand/stock info per category for the top 3
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, { totalStock: number, count: number }>();
    
    items.forEach(item => {
      const current = categoryMap.get(item.category) || { totalStock: 0, count: 0 };
      categoryMap.set(item.category, {
        totalStock: current.totalStock + item.quantity,
        count: current.count + 1,
      });
    });

    const data = Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      stock: stats.totalStock,
      avg: Math.round(stats.totalStock / stats.count),
    }));

    // Sort by lowest stock to show highest demand (simplified logic for turnover)
    data.sort((a, b) => a.stock - b.stock);

    return data.slice(0, 3);
  }, [items]);

  const colors = ['#f50057', '#ff9100', '#4dabf5'];

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <InsightsIcon color="secondary" fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Giro de Estoque (Top 3 Categorias Críticas)
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
            <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} width={100} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#131b2f', borderColor: 'rgba(255,255,255,0.1)' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="stock" name="Estoque Total" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
