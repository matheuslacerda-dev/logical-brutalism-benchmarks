"use client";

import React, { useMemo, useState } from 'react';
import { Table, Input, Button, Space, message } from 'antd';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useInventoryStore, ProductStatus, getStatus } from '../store/inventoryStore';
import { QuantityCell, StatusCell } from './Cells';

const { Search } = Input;

export const InventoryTable: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const searchQuery = useInventoryStore((state) => state.searchQuery);
  const setSearchQuery = useInventoryStore((state) => state.setSearchQuery);
  const statusFilter = useInventoryStore((state) => state.statusFilter);
  const setStatusFilter = useInventoryStore((state) => state.setStatusFilter);
  const batchUpdateStatus = useInventoryStore((state) => state.batchUpdateStatus);

  // Derive static data for table to prevent re-renders on quantity change
  const productsMap = useInventoryStore((state) => state.products);
  
  React.useEffect(() => {
    performance.mark('inventory-table-mount-end');
    performance.measure('InventoryTable Mount', 'inventory-table-mount-start', 'inventory-table-mount-end');
  }, []);

  if (typeof window !== 'undefined' && !performance.getEntriesByName('inventory-table-mount-start').length) {
    performance.mark('inventory-table-mount-start');
  }
  
  const filteredData = useMemo(() => {
    return Object.values(productsMap)
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.skuId.toLowerCase().includes(searchQuery.toLowerCase());
        const currentStatus = getStatus(p.quantity);
        const matchesStatus = statusFilter === 'Todos' || currentStatus === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [productsMap, searchQuery, statusFilter]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleBatchAction = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Selecione pelo menos um item para disparar ordem de compra.');
      return;
    }
    batchUpdateStatus(selectedRowKeys as string[]);
    message.success(`Ordem de compra disparada para ${selectedRowKeys.length} itens.`);
    setSelectedRowKeys([]);
  };

  const columns = [
    {
      title: 'SKU_ID',
      dataIndex: 'skuId',
      key: 'skuId',
      width: 120,
    },
    {
      title: 'Nome do Item',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      width: 150,
    },
    {
      title: 'Estoque',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: { skuId: string }) => <QuantityCell skuId={record.skuId} />,
    },
    {
      title: 'Preço (R$)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: { skuId: string }) => <StatusCell skuId={record.skuId} />,
    },
  ];

  return (
    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }} wrap>
        <Space>
          <Search
            placeholder="Buscar SKU ou Nome..."
            allowClear
            onSearch={(val) => setSearchQuery(val)}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type={statusFilter === 'Todos' ? 'primary' : 'default'} onClick={() => setStatusFilter('Todos')}>Todos</Button>
          <Button type={statusFilter === 'Disponível' ? 'primary' : 'default'} onClick={() => setStatusFilter('Disponível')}>Disponíveis</Button>
          <Button type={statusFilter === 'Crítico' ? 'primary' : 'default'} onClick={() => setStatusFilter('Crítico')} danger={statusFilter === 'Crítico'}>Críticos</Button>
          <Button type={statusFilter === 'Esgotado' ? 'primary' : 'default'} onClick={() => setStatusFilter('Esgotado')} danger>Esgotados</Button>
        </Space>
        
        <Button 
          type="primary" 
          icon={<ShoppingCartOutlined />} 
          onClick={handleBatchAction}
          disabled={selectedRowKeys.length === 0}
        >
          Disparar Ordem de Compra ({selectedRowKeys.length})
        </Button>
      </Space>

      <Table
        className="dense-table"
        rowKey="skuId"
        rowSelection={{ selectedRowKeys, onChange: onSelectChange }}
        columns={columns}
        dataSource={filteredData}
        pagination={false}
        size="small"
        scroll={{ y: 500 }}
      />
    </div>
  );
};
