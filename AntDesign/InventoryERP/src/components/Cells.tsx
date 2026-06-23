"use client";

import React from 'react';
import { Tag } from 'antd';
import { useInventoryStore, getStatus } from '../store/inventoryStore';

export const QuantityCell: React.FC<{ skuId: string }> = ({ skuId }) => {
  const quantity = useInventoryStore((state) => state.products[skuId]?.quantity ?? 0);

  return <span style={{ fontWeight: 600 }}>{quantity}</span>;
};

export const StatusCell: React.FC<{ skuId: string }> = ({ skuId }) => {
  const quantity = useInventoryStore((state) => state.products[skuId]?.quantity ?? 0);
  const status = getStatus(quantity);

  let color = 'green';
  if (status === 'Esgotado') color = 'red';
  else if (status === 'Crítico') color = 'orange';

  return <Tag color={color}>{status}</Tag>;
};
