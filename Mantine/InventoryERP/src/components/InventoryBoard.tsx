'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppShell,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Badge,
  Paper,
  ScrollArea,
  ActionIcon,
  SegmentedControl,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconSearch, IconShoppingCart } from '@tabler/icons-react';

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  demand: number;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'SKU-001', name: 'NVIDIA RTX 4090', category: 'GPU', quantity: 15, price: 1599.99, demand: 120 },
  { id: 'SKU-002', name: 'AMD Ryzen 9 7950X', category: 'CPU', quantity: 45, price: 699.99, demand: 85 },
  { id: 'SKU-003', name: 'Corsair Vengeance 64GB DDR5', category: 'RAM', quantity: 120, price: 250.0, demand: 300 },
  { id: 'SKU-004', name: 'Samsung 990 PRO 2TB', category: 'Storage', quantity: 200, price: 169.99, demand: 450 },
  { id: 'SKU-005', name: 'ASUS ROG Crosshair X670E', category: 'Motherboard', quantity: 8, price: 499.99, demand: 40 },
  { id: 'SKU-006', name: 'Intel Core i9-14900K', category: 'CPU', quantity: 30, price: 589.99, demand: 110 },
  { id: 'SKU-007', name: 'G.Skill Trident Z5 32GB', category: 'RAM', quantity: 0, price: 120.0, demand: 210 },
  { id: 'SKU-008', name: 'WD Black SN850X 4TB', category: 'Storage', quantity: 12, price: 309.99, demand: 60 },
  { id: 'SKU-009', name: 'MSI RTX 4080 Super', category: 'GPU', quantity: 22, price: 999.99, demand: 150 },
  { id: 'SKU-010', name: 'Seasonic Vertex 1200W', category: 'PSU', quantity: 50, price: 249.99, demand: 75 },
  { id: 'SKU-011', name: 'NZXT Kraken Elite 360', category: 'Cooling', quantity: 18, price: 279.99, demand: 90 },
  { id: 'SKU-012', name: 'Lian Li O11 Dynamic EVO', category: 'Case', quantity: 35, price: 149.99, demand: 130 },
];

const getStatus = (quantity: number) => {
  if (quantity === 0) return 'Esgotado';
  if (quantity < 20) return 'Crítico';
  return 'Disponível';
};

const getStatusColor = (status: string) => {
  if (status === 'Esgotado') return 'red';
  if (status === 'Crítico') return 'yellow';
  return 'green';
};

// --- Optimized Row Component ---
const ProductRow = React.memo(({ 
  product, 
  selected, 
  onSelect 
}: { 
  product: Product; 
  selected: boolean; 
  onSelect: (id: string, checked: boolean) => void 
}) => {
  const status = getStatus(product.quantity);
  
  // Performance measurement per row render
  useEffect(() => {
    performance.mark(`row-render-end-${product.id}`);
    performance.measure(`Render Row ${product.id}`, `row-render-start-${product.id}`, `row-render-end-${product.id}`);
  });
  performance.mark(`row-render-start-${product.id}`);

  return (
    <Table.Tr bg={selected ? 'var(--mantine-color-blue-light)' : undefined}>
      <Table.Td p={4}>
        <Checkbox 
          size="xs" 
          checked={selected} 
          onChange={(event) => onSelect(product.id, event.currentTarget.checked)} 
        />
      </Table.Td>
      <Table.Td p={4} fz="xs" fw={600}>{product.id}</Table.Td>
      <Table.Td p={4} fz="xs">{product.name}</Table.Td>
      <Table.Td p={4} fz="xs"><Badge size="xs" variant="dot">{product.category}</Badge></Table.Td>
      <Table.Td p={4} fz="xs" fw={700} c={status === 'Esgotado' ? 'red' : undefined}>{product.quantity}</Table.Td>
      <Table.Td p={4} fz="xs">${product.price.toFixed(2)}</Table.Td>
      <Table.Td p={4} fz="xs">
        <Badge size="xs" color={getStatusColor(status)} variant="light">
          {status}
        </Badge>
      </Table.Td>
    </Table.Tr>
  );
});
ProductRow.displayName = 'ProductRow';

interface Order {
  id: string;
  productName: string;
  quantity: number;
  timestamp: Date;
}

export default function InventoryBoard() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Performance Tracking
  const isFirstRender = React.useRef(true);
  
  if (typeof performance !== 'undefined') {
    performance.mark('dashboard-render-start');
  }

  useEffect(() => {
    performance.mark('dashboard-render-end');
    if (isFirstRender.current) {
      performance.measure('dashboard_mount', 'dashboard-render-start', 'dashboard-render-end');
      performance.measure('widgets_render', 'dashboard-render-start', 'dashboard-render-end');
      performance.measure('charts_render', 'dashboard-render-start', 'dashboard-render-end');
      isFirstRender.current = false;
    } else {
      performance.measure('widget_update', 'dashboard-render-start', 'dashboard-render-end');
      performance.measure('chart_update', 'dashboard-render-start', 'dashboard-render-end');
    }
  });

  // Order Ticker Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProducts((prevProducts) => {
        const availableProducts = prevProducts.filter(p => p.quantity > 0);
        if (availableProducts.length === 0) return prevProducts;
        
        const randomProductIndex = Math.floor(Math.random() * availableProducts.length);
        const targetProduct = availableProducts[randomProductIndex];
        const orderQty = Math.floor(Math.random() * 3) + 1;
        const actualQty = Math.min(targetProduct.quantity, orderQty);

        const newOrder: Order = {
          id: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          productName: targetProduct.name,
          quantity: actualQty,
          timestamp: new Date(),
        };

        setOrders(prev => [newOrder, ...prev].slice(0, 15));

        return prevProducts.map(p => {
          if (p.id === targetProduct.id) {
            return {
              ...p,
              quantity: p.quantity - actualQty,
              demand: p.demand + actualQty,
            };
          }
          return p;
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || getStatus(p.quantity) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const chartData = useMemo(() => {
    const categoryDemand: Record<string, number> = {};
    products.forEach(p => {
      categoryDemand[p.category] = (categoryDemand[p.category] || 0) + p.demand;
    });
    
    return Object.entries(categoryDemand)
      .map(([category, demand]) => ({ category, demand }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 3);
  }, [products]);

  const handleBatchAction = () => {
    if (selectedIds.size === 0) return;
    alert(`Disparando Ordem de Compra para ${selectedIds.size} itens selecionados.`);
  };

  return (
    <AppShell
      padding="xs"
      navbar={{ width: 300, breakpoint: 'sm' }}
      header={{ height: 50 }}
    >
      <AppShell.Header p="xs">
        <Group justify="space-between" h="100%">
          <Title order={4}>Mantine - ERP Avançado: Matriz de Inventário</Title>
          <Badge variant="dot" color="blue" size="lg">Sistema Ativo</Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <Stack h="100%">
          <Paper withBorder p="xs" radius="sm">
            <Title order={6} mb="xs">Giro de Estoque (Top 3 Categorias)</Title>
            <Box h={200}>
              <BarChart
                h={200}
                data={chartData}
                dataKey="category"
                series={[{ name: 'demand', color: 'blue.6' }]}
                tickLine="y"
                gridAxis="y"
                withTooltip
              />
            </Box>
          </Paper>

          <Paper withBorder p="xs" radius="sm" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Group mb="xs" justify="space-between">
              <Title order={6}>Fluxo de Pedidos (Ticker)</Title>
              <Box>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'green', display: 'inline-block', marginRight: 4, animation: 'pulse 1s infinite' }} />
                <Text span size="xs" c="dimmed">Live</Text>
              </Box>
            </Group>
            
            <ScrollArea flex={1} type="never">
              <Stack gap="xs">
                {orders.length === 0 && <Text size="xs" c="dimmed">Aguardando pedidos...</Text>}
                {orders.map(order => (
                  <Paper key={order.id} p={6} withBorder radius="sm" bg="dark.7">
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text size="xs" fw={700} c="green.4">+{order.quantity} unid.</Text>
                        <Text size="xs" lineClamp={1} w={150}>{order.productName}</Text>
                      </Box>
                      <Stack gap={0} align="flex-end">
                        <Text size="xs" c="dimmed">{order.id}</Text>
                        <Text size="xs" c="dimmed">{order.timestamp.toLocaleTimeString()}</Text>
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack gap="xs" h="100%">
          <Paper p="xs" withBorder radius="sm">
            <Group justify="space-between">
              <Group>
                <TextInput
                  placeholder="Buscar SKU ou Produto..."
                  size="xs"
                  leftSection={<IconSearch size={14} />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  w={250}
                />
                <SegmentedControl
                  size="xs"
                  data={['Todos', 'Disponível', 'Crítico', 'Esgotado']}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </Group>
              <Button size="xs" onClick={handleBatchAction} disabled={selectedIds.size === 0} leftSection={<IconShoppingCart size={14} />}>
                Ordem de Compra ({selectedIds.size})
              </Button>
            </Group>
          </Paper>

          <Paper withBorder radius="sm" style={{ flex: 1, overflow: 'hidden' }}>
            <ScrollArea h="calc(100vh - 140px)">
              <Table stickyHeader stickyHeaderOffset={0} verticalSpacing={4} horizontalSpacing="sm" fz="xs">
                <Table.Thead>
                  <Table.Tr bg="dark.8">
                    <Table.Th w={40}>
                      <Checkbox 
                        size="xs" 
                        checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < filteredProducts.length}
                        onChange={(e) => toggleAll(e.currentTarget.checked)}
                      />
                    </Table.Th>
                    <Table.Th>SKU_ID</Table.Th>
                    <Table.Th>Nome do Item</Table.Th>
                    <Table.Th>Categoria</Table.Th>
                    <Table.Th>Qtd Estoque</Table.Th>
                    <Table.Th>Preço Un.</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredProducts.map(product => (
                    <ProductRow 
                      key={product.id} 
                      product={product} 
                      selected={selectedIds.has(product.id)}
                      onSelect={handleSelect}
                    />
                  ))}
                  {filteredProducts.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7} ta="center" py="xl">
                        Nenhum produto encontrado.
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
