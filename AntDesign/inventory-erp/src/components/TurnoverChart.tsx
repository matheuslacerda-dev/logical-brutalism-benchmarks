"use client";

import React, { useMemo } from 'react';
import { Card } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useInventoryStore } from '../store/inventoryStore';

export const TurnoverChart: React.FC = () => {
  const products = useInventoryStore(state => state.products);

  React.useEffect(() => {
    performance.mark('turnover-chart-mount-end');
    performance.measure('TurnoverChart Mount', 'turnover-chart-mount-start', 'turnover-chart-mount-end');
  }, []);

  if (typeof window !== 'undefined' && !performance.getEntriesByName('turnover-chart-mount-start').length) {
    performance.mark('turnover-chart-mount-start');
  }

  const data = useMemo(() => {
    const categoryDemand: Record<string, number> = {};

    Object.values(products).forEach(p => {
      const demand = p.initialQuantity - p.quantity;
      if (demand > 0) {
        if (!categoryDemand[p.category]) categoryDemand[p.category] = 0;
        categoryDemand[p.category] += demand;
      }
    });

    const sortedCategories = Object.keys(categoryDemand)
      .map(cat => ({ category: cat, demand: categoryDemand[cat] }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 3); // Top 3

    if (typeof window !== 'undefined') {
      const updateId = Math.random().toString(36).substr(2, 6);
      performance.mark(`chart-update-start-${updateId}`);
      requestAnimationFrame(() => {
        performance.mark(`chart-update-end-${updateId}`);
        performance.measure(`Chart Update Render ${updateId}`, `chart-update-start-${updateId}`, `chart-update-end-${updateId}`);
      });
    }

    return sortedCategories;
  }, [products]);

  const colors = ['#1890ff', '#52c41a', '#faad14'];

  return (
    <Card 
      title="Análise de Giro de Estoque (Top 3 Categorias)" 
      size="small" 
      className="dense-card"
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <div style={{ width: '100%', height: 250 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="demand" radius={[4, 4, 0, 0]} animationDuration={500}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            Aguardando dados de saída...
          </div>
        )}
      </div>
    </Card>
  );
};
