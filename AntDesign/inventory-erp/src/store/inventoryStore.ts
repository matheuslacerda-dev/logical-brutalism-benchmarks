import { create } from 'zustand';

export type ProductStatus = 'Disponível' | 'Crítico' | 'Esgotado';

export interface Product {
  skuId: string;
  name: string;
  category: string;
  quantity: number;
  initialQuantity: number;
  price: number;
}

export interface Order {
  id: string;
  skuId: string;
  quantity: number;
  timestamp: number;
}

interface InventoryState {
  products: Record<string, Product>;
  orders: Order[];
  searchQuery: string;
  statusFilter: ProductStatus | 'Todos';
  addOrder: (order: Order) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ProductStatus | 'Todos') => void;
  batchUpdateStatus: (skuIds: string[]) => void;
}

export const getStatus = (quantity: number): ProductStatus => {
  if (quantity === 0) return 'Esgotado';
  if (quantity <= 10) return 'Crítico';
  return 'Disponível';
};

const initialProducts: Record<string, Product> = {
  'SKU-001': { skuId: 'SKU-001', name: 'Servidor Blade X1', category: 'Servidores', quantity: 50, initialQuantity: 50, price: 15000 },
  'SKU-002': { skuId: 'SKU-002', name: 'Switch Core 48 Portas', category: 'Redes', quantity: 15, initialQuantity: 15, price: 8500 },
  'SKU-003': { skuId: 'SKU-003', name: 'Roteador Edge BGP', category: 'Redes', quantity: 5, initialQuantity: 5, price: 12000 },
  'SKU-004': { skuId: 'SKU-004', name: 'Storage NVMe 100TB', category: 'Armazenamento', quantity: 8, initialQuantity: 8, price: 45000 },
  'SKU-005': { skuId: 'SKU-005', name: 'RAM 128GB ECC', category: 'Componentes', quantity: 120, initialQuantity: 120, price: 2000 },
  'SKU-006': { skuId: 'SKU-006', name: 'CPU 64-Core EPYC', category: 'Componentes', quantity: 2, initialQuantity: 2, price: 35000 },
  'SKU-007': { skuId: 'SKU-007', name: 'Firewall NGFW', category: 'Segurança', quantity: 0, initialQuantity: 0, price: 18000 },
  'SKU-008': { skuId: 'SKU-008', name: 'Access Point WiFi 6E', category: 'Redes', quantity: 85, initialQuantity: 85, price: 1200 },
  'SKU-009': { skuId: 'SKU-009', name: 'Nobreak 10kVA', category: 'Energia', quantity: 10, initialQuantity: 10, price: 9500 },
  'SKU-010': { skuId: 'SKU-010', name: 'Rack 42U', category: 'Infraestrutura', quantity: 25, initialQuantity: 25, price: 3200 },
  'SKU-011': { skuId: 'SKU-011', name: 'Cabo QSFP28 100G', category: 'Redes', quantity: 200, initialQuantity: 200, price: 450 },
  'SKU-012': { skuId: 'SKU-012', name: 'Licença VMware vSphere', category: 'Software', quantity: 999, initialQuantity: 999, price: 5000 },
};

export const useInventoryStore = create<InventoryState>((set) => ({
  products: initialProducts,
  orders: [],
  searchQuery: '',
  statusFilter: 'Todos',
  addOrder: (order) => set((state) => {
    performance.mark(`order-start-${order.id}`);
    const product = state.products[order.skuId];
    if (!product || product.quantity === 0) return state; // Can't order out of stock for now
    
    // Decrease stock but not below 0
    const newQuantity = Math.max(0, product.quantity - order.quantity);
    
    requestAnimationFrame(() => {
        performance.mark(`order-end-${order.id}`);
        performance.measure(`Order Mutation Render ${order.id}`, `order-start-${order.id}`, `order-end-${order.id}`);
        // Log to console to show we are measuring
        console.log(`Measured Order Mutation Render ${order.id}`);
    });

    return {
      products: {
        ...state.products,
        [order.skuId]: { ...product, quantity: newQuantity }
      },
      orders: [order, ...state.orders].slice(0, 50)
    };
  }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  batchUpdateStatus: (skuIds) => set((state) => {
    // For now we just log, but if needed we could mutate status here
    console.log("Batch updating POs for SKUs:", skuIds);
    return state;
  })
}));
