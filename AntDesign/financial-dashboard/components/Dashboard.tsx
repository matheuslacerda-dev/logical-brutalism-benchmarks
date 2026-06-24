'use client';

import React, { useState } from 'react';
import { Layout, Menu, Typography, Input, Row, Col, Space, AutoComplete, Card } from 'antd';
import { 
  LineChartOutlined, 
  WalletOutlined, 
  SettingOutlined,
  SearchOutlined,
  BellOutlined
} from '@ant-design/icons';
import { StockCard } from './StockCard';
import { StockChart } from './StockChart';
import useSWR from 'swr';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [searchValue, setSearchValue] = useState('');
  
  const { data: searchResults } = useSWR(
    searchValue.length > 1 ? `/api/search?q=${searchValue}` : null, 
    fetcher
  );

  const searchOptions = searchResults?.map((res: any) => ({
    value: res.symbol,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{res.symbol}</span>
        <span style={{ color: '#94a3b8' }}>{res.shortname}</span>
      </div>
    )
  })) || [];

  const handleSelect = (value: string) => {
    setSelectedSymbol(value);
    setSearchValue('');
  };

  React.useEffect(() => {
    try {
      performance.mark('dashboard_mount_end');
      performance.measure('dashboard_mount_duration', 'dashboard_mount_start', 'dashboard_mount_end');
    } catch(e) {}
  }, []);

  if (typeof performance !== 'undefined' && !performance.getEntriesByName('dashboard_mount_start').length) {
    performance.mark('dashboard_mount_start');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} breakpoint="lg" collapsedWidth="0">
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LineChartOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <Title level={4} style={{ color: '#f8fafc', margin: 0 }}>Ant Design</Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            { key: '1', icon: <LineChartOutlined />, label: 'Mercado' },
            { key: '2', icon: <WalletOutlined />, label: 'Portfólio' },
            { key: '3', icon: <SettingOutlined />, label: 'Configurações' },
          ]}
        />
      </Sider>
      
      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <AutoComplete
            options={searchOptions}
            onSelect={handleSelect}
            onSearch={setSearchValue}
            value={searchValue}
            style={{ width: 300 }}
            classNames={{ popup: { root: 'glass-panel' } }}
          >
            <Input 
              size="large" 
              placeholder="Buscar ativo (ex: AAPL, PETR4.SA)..." 
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
              style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </AutoComplete>
          
          <Space size="large">
            <BellOutlined style={{ fontSize: 20, color: '#94a3b8', cursor: 'pointer' }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#334155', border: '1px solid #475569' }} />
          </Space>
        </Header>
        
        <Content style={{ padding: '24px', overflowY: 'auto' }}>
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2} style={{ color: '#f8fafc', margin: 0 }}>Visão Geral do Mercado</Title>
              <Text style={{ color: '#94a3b8' }}>Acompanhe as cotações em tempo real.</Text>
            </div>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <StockCard symbol={selectedSymbol} />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StockCard symbol="^GSPC" />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StockCard symbol="BTC-USD" />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StockCard symbol="BRL=X" />
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <StockChart symbol={selectedSymbol} />
              </Col>
              <Col xs={24} lg={8}>
                <Card className="glass-panel" style={{ height: '100%', minHeight: 400 }}>
                  <Title level={5} style={{ color: '#f8fafc' }}>Ativos Populares</Title>
                  <Space orientation="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
                    <div style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} onClick={() => setSelectedSymbol('MSFT')}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>MSFT</Text>
                      <br/>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>Microsoft Corporation</Text>
                    </div>
                    <div style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} onClick={() => setSelectedSymbol('GOOGL')}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>GOOGL</Text>
                      <br/>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>Alphabet Inc.</Text>
                    </div>
                    <div style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} onClick={() => setSelectedSymbol('NVDA')}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>NVDA</Text>
                      <br/>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>NVIDIA Corporation</Text>
                    </div>
                    <div style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} onClick={() => setSelectedSymbol('PETR4.SA')}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>PETR4.SA</Text>
                      <br/>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>Petrobras S.A.</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}
