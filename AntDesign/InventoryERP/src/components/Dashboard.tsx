"use client";

import React from 'react';
import { Row, Col, Typography, Layout } from 'antd';
import { InventoryTable } from './InventoryTable';
import { OrderTicker } from './OrderTicker';
import { TurnoverChart } from './TurnoverChart';
import { BenchmarkAnalyzer } from './BenchmarkAnalyzer';

const { Header, Content } = Layout;
const { Title } = Typography;

export const Dashboard: React.FC = () => {
  React.useEffect(() => {
    performance.mark('dashboard-mount-end');
    performance.measure('Dashboard Mount', 'dashboard-mount-start', 'dashboard-mount-end');
  }, []);

  if (typeof window !== 'undefined' && !performance.getEntriesByName('dashboard-mount-start').length) {
    performance.mark('dashboard-mount-start');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          Ant Design - Matriz de Inventário ERP Avançado
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={18}>
            <InventoryTable />
          </Col>
          
          <Col xs={24} xl={6}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <TurnoverChart />
              </Col>
              <Col span={24}>
                <OrderTicker />
              </Col>
            </Row>
          </Col>
        </Row>
      </Content>
      <BenchmarkAnalyzer />
    </Layout>
  );
};
