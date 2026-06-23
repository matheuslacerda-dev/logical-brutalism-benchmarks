'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { InventoryItem, Order } from '@/types/inventory';

interface InventoryContextData {
  items: InventoryItem[];
  orders: Order[];
  updateQuantity: (id: string, change: number) => void;
  addOrder: (order: Order) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  batchActionAction: () => void;
}

const initialItems: InventoryItem[] = [
  { id: '1', sku: 'GPU-RTX4090', name: 'NVIDIA RTX 4090 24GB', category: 'Placas de Vídeo', quantity: 15, price: 1599.99, status: 'Disponível' },
  { id: '2', sku: 'CPU-I913900K', name: 'Intel Core i9-13900K', category: 'Processadores', quantity: 4, price: 589.99, status: 'Crítico' },
  { id: '3', sku: 'RAM-DDR5-64G', name: 'Corsair Vengeance 64GB DDR5', category: 'Memória RAM', quantity: 42, price: 219.99, status: 'Disponível' },
  { id: '4', sku: 'SSD-SN850X-2T', name: 'WD Black SN850X 2TB', category: 'Armazenamento', quantity: 0, price: 159.99, status: 'Esgotado' },
  { id: '5', sku: 'MB-Z790-HERO', name: 'ASUS ROG Maximus Z790', category: 'Placas-mãe', quantity: 8, price: 629.99, status: 'Disponível' },
  { id: '6', sku: 'PSU-RM1000X', name: 'Corsair RM1000x 1000W', category: 'Fontes', quantity: 2, price: 189.99, status: 'Crítico' },
  { id: '7', sku: 'CASE-011D-XL', name: 'Lian Li O11 Dynamic XL', category: 'Gabinetes', quantity: 18, price: 229.99, status: 'Disponível' },
  { id: '8', sku: 'COOL-KRAKENZ73', name: 'NZXT Kraken Z73 RGB', category: 'Refrigeração', quantity: 0, price: 289.99, status: 'Esgotado' },
  { id: '9', sku: 'MON-AW3423DW', name: 'Alienware 34" QD-OLED', category: 'Monitores', quantity: 5, price: 1299.99, status: 'Crítico' },
  { id: '10', sku: 'KB-G915-TKL', name: 'Logitech G915 TKL Lightspeed', category: 'Periféricos', quantity: 25, price: 229.99, status: 'Disponível' },
  { id: '11', sku: 'MOUSE-GPXSL', name: 'Logitech G Pro X Superlight', category: 'Periféricos', quantity: 30, price: 149.99, status: 'Disponível' },
  { id: '12', sku: 'HS-ASTRO-A50', name: 'Astro A50 Wireless Gen 4', category: 'Periféricos', quantity: 1, price: 299.99, status: 'Crítico' },
];

const InventoryContext = createContext<InventoryContextData | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const updateQuantity = useCallback((id: string, change: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          let newStatus = item.status;
          if (newQuantity === 0) newStatus = 'Esgotado';
          else if (newQuantity < 5) newStatus = 'Crítico';
          else newStatus = 'Disponível';

          return { ...item, quantity: newQuantity, status: newStatus };
        }
        return item;
      })
    );
  }, []);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev].slice(0, 50)); // Keep last 50
    updateQuantity(order.skuId, order.quantityChange);
  }, [updateQuantity]);

  const batchActionAction = useCallback(() => {
    if (selectedIds.length === 0) return;
    alert(`Disparar Ordem de Compra para ${selectedIds.length} itens selecionados.`);
    setSelectedIds([]);
  }, [selectedIds]);

  const contextValue = useMemo(() => ({
    items,
    orders,
    updateQuantity,
    addOrder,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    setSelectedIds,
    batchActionAction,
  }), [items, orders, updateQuantity, addOrder, searchQuery, statusFilter, selectedIds, batchActionAction]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
