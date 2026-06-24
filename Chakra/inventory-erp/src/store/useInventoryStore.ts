import { create } from 'zustand'

export type ItemStatus = 'Disponível' | 'Crítico' | 'Esgotado'

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  price: number
  status: ItemStatus
  selected?: boolean
}

export interface OrderAction {
  id: string
  skuId: string
  qty: number
  timestamp: number
}

interface InventoryState {
  items: Record<string, InventoryItem>
  itemIds: string[]
  searchQuery: string
  statusFilter: string | null
  orders: OrderAction[]
  
  // Actions
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: string | null) => void
  toggleSelection: (id: string) => void
  processOrder: (skuId: string, qtyToRemove: number) => void
  batchOrderAction: () => void
}

const initialItemsList: InventoryItem[] = [
  { id: 'SKU-001', name: 'Processador Intel Core i9-14900K', category: 'Processadores', quantity: 45, price: 589.99, status: 'Disponível' },
  { id: 'SKU-002', name: 'Placa de Vídeo RTX 4090', category: 'Placas de Vídeo', quantity: 12, price: 1599.99, status: 'Crítico' },
  { id: 'SKU-003', name: 'Memória RAM Corsair 32GB DDR5', category: 'Memória', quantity: 150, price: 129.99, status: 'Disponível' },
  { id: 'SKU-004', name: 'SSD Samsung 990 PRO 2TB', category: 'Armazenamento', quantity: 8, price: 169.99, status: 'Crítico' },
  { id: 'SKU-005', name: 'Placa Mãe ASUS ROG Maximus', category: 'Placas Mãe', quantity: 25, price: 699.99, status: 'Disponível' },
  { id: 'SKU-006', name: 'Fonte Corsair RM1000x', category: 'Fontes', quantity: 0, price: 189.99, status: 'Esgotado' },
  { id: 'SKU-007', name: 'Gabinete Lian Li O11 Dynamic', category: 'Gabinetes', quantity: 34, price: 149.99, status: 'Disponível' },
  { id: 'SKU-008', name: 'Water Cooler NZXT Kraken', category: 'Refrigeração', quantity: 18, price: 279.99, status: 'Disponível' },
  { id: 'SKU-009', name: 'Monitor Alienware 34" OLED', category: 'Monitores', quantity: 5, price: 999.99, status: 'Crítico' },
  { id: 'SKU-010', name: 'Teclado Mecânico Keychron Q1', category: 'Periféricos', quantity: 60, price: 199.99, status: 'Disponível' },
  { id: 'SKU-011', name: 'Mouse Logitech G Pro X Superlight', category: 'Periféricos', quantity: 42, price: 149.99, status: 'Disponível' },
  { id: 'SKU-012', name: 'Processador AMD Ryzen 9 7950X3D', category: 'Processadores', quantity: 28, price: 699.99, status: 'Disponível' },
]

const initialItems: Record<string, InventoryItem> = {}
initialItemsList.forEach(item => {
  initialItems[item.id] = item
})

const getStatus = (qty: number): ItemStatus => {
  if (qty <= 0) return 'Esgotado'
  if (qty <= 15) return 'Crítico'
  return 'Disponível'
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: initialItems,
  itemIds: initialItemsList.map(item => item.id),
  searchQuery: '',
  statusFilter: null,
  orders: [],

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  toggleSelection: (id) => set((state) => ({
    items: {
      ...state.items,
      [id]: {
        ...state.items[id],
        selected: !state.items[id].selected
      }
    }
  })),

  processOrder: (skuId, qtyToRemove) => set((state) => {
    const item = state.items[skuId]
    if (!item) return state

    const newQty = Math.max(0, item.quantity - qtyToRemove)
    const newStatus = getStatus(newQty)

    const order: OrderAction = {
      id: Math.random().toString(36).substring(7),
      skuId,
      qty: qtyToRemove,
      timestamp: Date.now()
    }

    return {
      items: {
        ...state.items,
        [skuId]: {
          ...item,
          quantity: newQty,
          status: newStatus
        }
      },
      orders: [order, ...state.orders].slice(0, 50) // keep last 50
    }
  }),

  batchOrderAction: () => set((state) => {
    const newItems = { ...state.items }
    Object.keys(newItems).forEach(id => {
      if (newItems[id].selected) {
        // Disparar "Ordem de Compra" - Repor 50 unidades
        newItems[id] = {
          ...newItems[id],
          quantity: newItems[id].quantity + 50,
          status: getStatus(newItems[id].quantity + 50),
          selected: false
        }
      }
    })
    return { items: newItems }
  })
}))
