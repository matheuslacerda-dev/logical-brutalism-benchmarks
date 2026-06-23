"use client";

import React, { useEffect } from 'react';
import { Card, Typography, Badge, Space } from 'antd';
import { useInventoryStore } from '../store/inventoryStore';

const { Text } = Typography;

export const OrderTicker: React.FC = () => {
  const orders = useInventoryStore(state => state.orders);
  const addOrder = useInventoryStore(state => state.addOrder);
  const products = useInventoryStore(state => state.products);

  // Generate random orders
  useEffect(() => {
    const interval = setInterval(() => {
      const skus = Object.keys(products);
      const randomSku = skus[Math.floor(Math.random() * skus.length)];
      
      const newOrder = {
        id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        skuId: randomSku,
        quantity: Math.floor(Math.random() * 5) + 1, // 1 to 5 items
        timestamp: Date.now()
      };
      
      addOrder(newOrder);
    }, 4000); // 4 seconds requirement

    return () => clearInterval(interval);
  }, [products, addOrder]);

  return (
    <Card 
      title="Fluxo de Pedidos em Tempo Real" 
      size="small" 
      className="dense-card"
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <div style={{ height: 400, overflowY: 'auto', padding: '0 8px' }}>
        {orders.map(order => (
          <div className="ticker-item" key={order.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space direction="vertical" size={0}>
                <Text strong>{order.id}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{order.skuId}</Text>
              </Space>
              <Badge count={`-${order.quantity}`} color="#f5222d" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


