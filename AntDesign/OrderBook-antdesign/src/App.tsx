import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Table, Card, Typography, Badge, Row, Col, Statistic } from 'antd';
import BenchmarkAnalyzer from './BenchmarkAnalyzer';

const { Title, Text } = Typography;

// Generates 100 rows of mock order book data
const generateInitialData = () => {
  const data = [];
  let basePrice = 64000.00;
  
  for (let i = 0; i < 100; i++) {
    // Top 50 are Asks (Sell), Bottom 50 are Bids (Buy)
    const isAsk = i < 50;
    
    // Spread prices
    const priceOffset = isAsk ? (50 - i) * 2.5 : (i - 50) * -2.5; 
    const price = basePrice + priceOffset;

    data.push({
      id: `ORD-${1000 + i}`,
      type: isAsk ? 'sell' : 'buy',
      price: price.toFixed(2),
      amount: (Math.random() * 2 + 0.1).toFixed(4),
      direction: null as 'up' | 'down' | null, 
    });
  }
  return data;
};

export default function App() {
  const [data, setData] = useState(generateInitialData());
  const isFirstRender = useRef(true);

  // Measure initial dashboard mount
  if (isFirstRender.current && performance.getEntriesByName('dashboard_mount_start').length === 0) {
    performance.mark('dashboard_mount_start');
  }

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      performance.measure('dashboard_mount', 'dashboard_mount_start');
      isFirstRender.current = false;
    }
  }, []);

  // Measure widget updates whenever data changes
  useLayoutEffect(() => {
    if (performance.getEntriesByName('widget_update_start').length > 0) {
      performance.measure('widget_update', 'widget_update_start');
      
      const measures = performance.getEntriesByName('widget_update');
      if (measures.length > 0) {
        const latestMeasure = measures[measures.length - 1];
        const globalAny = window as any;
        if (!globalAny.__WIDGET_DURATIONS) globalAny.__WIDGET_DURATIONS = [];
        globalAny.__WIDGET_DURATIONS.push(latestMeasure.duration);
      }

      performance.clearMarks('widget_update_start');
      performance.clearMeasures('widget_update');
    }
  }, [data]);

  useEffect(() => {
    // Simulate WebSocket connection with 50ms tick
    const interval = setInterval(() => {
      // Global metrics for Benchmark Analyzer
      const globalAny = window as any;
      if (!globalAny.__WS_METRICS) {
        globalAny.__WS_METRICS = { messages: 0, received_mb: 0 };
      }
      globalAny.__WS_METRICS.messages += 1;
      // We will calculate received_mb below with exact byte size

      performance.mark('widget_update_start');

      setData((prevData) => {
        const newData = [...prevData];
        // Mutate between 10 and 20 rows randomly per tick
        const numUpdates = Math.floor(Math.random() * 11) + 10; 
        const mutatedPayload = [];
        
        for (let i = 0; i < numUpdates; i++) {
          const randomIndex = Math.floor(Math.random() * 100);
          const row = newData[randomIndex];
          const oldPrice = parseFloat(row.price);
          
          // Apply random volatility (-15 to +15)
          const volatility = (Math.random() - 0.5) * 30; 
          const newPrice = oldPrice + volatility;
          
          const updatedRow = {
            ...row,
            price: newPrice.toFixed(2),
            direction: (newPrice > oldPrice ? 'up' : 'down') as 'up' | 'down'
          };
          
          newData[randomIndex] = updatedRow;
          mutatedPayload.push(updatedRow);
        }
        
        // Exact byte calculation of the WS payload
        const payloadBytes = new Blob([JSON.stringify(mutatedPayload)]).size;
        globalAny.__WS_METRICS.received_mb += payloadBytes / (1024 * 1024);
        
        return newData;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <Text type="secondary">{id}</Text>,
    },
    {
      title: 'Side',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Badge 
          status={type === 'sell' ? 'error' : 'success'} 
          text={type === 'sell' ? 'Ask' : 'Bid'} 
        />
      ),
    },
    {
      title: 'Price (USD)',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      align: 'right' as const,
      render: (price: string, record: any) => {
        let bgColor = 'transparent';
        if (record.direction === 'up') bgColor = 'rgba(82, 196, 26, 0.15)'; // Antd Success (light)
        if (record.direction === 'down') bgColor = 'rgba(255, 77, 79, 0.15)'; // Antd Error (light)

        return (
          <div style={{
            backgroundColor: bgColor,
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.1s ease-in-out',
            color: record.direction === 'up' ? '#389e0d' : record.direction === 'down' ? '#cf1322' : 'inherit',
            fontWeight: 500,
            display: 'inline-block',
            width: '100%',
            textAlign: 'right'
          }}>
            {parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        );
      }
    },
    {
      title: 'Amount (BTC)',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (amount: string) => <Text>{amount}</Text>
    },
    {
      title: 'Total (USD)',
      key: 'total',
      width: 150,
      align: 'right' as const,
      render: (_: any, record: any) => {
        const total = parseFloat(record.price) * parseFloat(record.amount);
        return <Text strong>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
      }
    }
  ];

  return (
    <div style={{ padding: '32px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Row justify="center">
        <Col xs={24} lg={20} xl={16}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Ant Design (B2B Order Book Benchmark)</Title>
                <Badge status="processing" text="WebSocket Live (50ms tick)" />
              </div>
            } 
            extra={
              <Statistic 
                title="Refresh Rate" 
                value={20}
                suffix="Hz" 
                valueStyle={{ color: '#1890ff', fontSize: 16 }} 
              />
            }
            bordered={false}
            styles={{ body: { padding: 0 } }}
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Table
              dataSource={data}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 640 }}
            />
          </Card>
        </Col>
      </Row>
      <BenchmarkAnalyzer />
    </div>
  );
}
