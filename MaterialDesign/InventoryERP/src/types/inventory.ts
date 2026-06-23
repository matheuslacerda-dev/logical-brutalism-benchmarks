export type ItemStatus = 'Disponível' | 'Crítico' | 'Esgotado';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: ItemStatus;
}

export interface Order {
  id: string;
  skuId: string;
  quantityChange: number;
  timestamp: Date;
}
