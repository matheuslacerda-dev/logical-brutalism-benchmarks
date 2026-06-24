import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Badge,
  Paper,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import BenchmarkAnalyzer from './components/BenchmarkAnalyzer';

// Global WS simulation stats
window.__SIMULATED_WS_MESSAGES = 0;
window.__SIMULATED_WS_BYTES = 0;

// Criação de um tema Material Design básico e escuro, focado em painéis financeiros B2B
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    primary: {
      main: '#90caf9',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Helper para gerar os 100 registros iniciais
const generateInitialData = (numRows = 100) => {
  const data = [];
  for (let i = 0; i < numRows; i++) {
    data.push({
      id: i,
      symbol: `SYM-00${i}`,
      bid: (Math.random() * 100 + 10).toFixed(2),
      ask: (Math.random() * 100 + 10).toFixed(2),
      volume: Math.floor(Math.random() * 10000),
      flash: null // 'up', 'down', ou null
    });
  }
  return data;
};

function OrderBookDashboard() {
  const [orderBook, setOrderBook] = useState(generateInitialData());
  const [isConnected, setIsConnected] = useState(true);
  
  // States and refs for accurate performance marking
  const [chartData, setChartData] = useState([50, 50, 50, 50, 50]);
  const updateMarkRef = useRef(null);
  const chartMarkRef = useRef(null);

  useEffect(() => {
    performance.mark('dashboard_mount_start');
    
    // Mount measure
    setTimeout(() => {
      performance.mark('dashboard_mount_end');
      performance.measure('dashboard_mount', 'dashboard_mount_start', 'dashboard_mount_end');
    }, 0);

    // Simula uma conexão de WS rodando a cada 50ms internamente
    const interval = setInterval(() => {
      const widgetMark = `widget_update_start_${Date.now()}_${Math.random()}`;
      const chartMark = `chart_update_start_${Date.now()}_${Math.random()}`;
      
      performance.mark(widgetMark);
      updateMarkRef.current = widgetMark;
      
      performance.mark(chartMark);
      chartMarkRef.current = chartMark;

      setOrderBook((prevBook) => {
        const newBook = [...prevBook];
        const updatesCount = Math.floor(Math.random() * 11) + 10;
        
        const indicesToUpdate = new Set();
        while (indicesToUpdate.size < updatesCount) {
          indicesToUpdate.add(Math.floor(Math.random() * 100));
        }

        const exactPayload = [];

        for (let i = 0; i < 100; i++) {
          const row = newBook[i];
          if (indicesToUpdate.has(i)) {
            const change = (Math.random() - 0.5) * 5;
            const oldBid = parseFloat(row.bid);
            const newBid = Math.max(1, oldBid + change);
            const newAsk = newBid + Math.random();
            
            exactPayload.push({ id: row.id, bid: newBid.toFixed(2), ask: newAsk.toFixed(2), change });
            
            newBook[i] = {
              ...row,
              bid: newBid.toFixed(2),
              ask: newAsk.toFixed(2),
              flash: change > 0 ? 'up' : 'down'
            };
          } else if (row.flash) {
            newBook[i] = {
              ...row,
              flash: null
            };
          }
        }

        // Medição do byte real sem mockar o tamanho
        const payloadString = JSON.stringify(exactPayload);
        window.__SIMULATED_WS_MESSAGES += 1;
        window.__SIMULATED_WS_BYTES += new Blob([payloadString]).size;

        return newBook;
      });

      // Atualiza o gráfico dummy
      setChartData(prev => prev.map(() => Math.floor(Math.random() * 100)));

    }, 50);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  useLayoutEffect(() => {
    if (updateMarkRef.current) {
      const endMark = `widget_update_end_${Date.now()}_${Math.random()}`;
      performance.mark(endMark);
      performance.measure('widget_update', updateMarkRef.current, endMark);
      updateMarkRef.current = null;
    }
  }, [orderBook]);

  useLayoutEffect(() => {
    if (chartMarkRef.current) {
      const endMark = `chart_update_end_${Date.now()}_${Math.random()}`;
      performance.mark(endMark);
      performance.measure('chart_update', chartMarkRef.current, endMark);
      chartMarkRef.current = null;
    }
    
    // Clear buffer automatically
    if (performance.getEntriesByName('widget_update').length > 1000) {
      performance.clearMeasures('widget_update');
      performance.clearMeasures('chart_update');
      performance.clearMarks();
    }
  }, [chartData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card elevation={4} sx={{ borderRadius: 2 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5" component="h1" fontWeight="bold">
                MaterialDesign Order Book Dashboard
              </Typography>
              <Badge 
                color={isConnected ? "success" : "error"} 
                variant="dot" 
                overlap="circular"
                sx={{ '& .MuiBadge-badge': { width: 12, height: 12, borderRadius: '50%' } }}
              >
                <LiveTvIcon color={isConnected ? "success" : "disabled"} />
              </Badge>
            </Box>
          }
          subheader="Real-time B2B Financial Market Data"
          sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
        />
        <CardContent sx={{ p: 0 }}>
          {/* Mini Chart Area */}
          <Box sx={{ display: 'flex', gap: 1, p: 2, height: 60, alignItems: 'flex-end', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {chartData.map((val, idx) => (
              <Box key={idx} sx={{ flex: 1, height: `${val}%`, backgroundColor: 'primary.main', opacity: 0.8, borderRadius: '4px 4px 0 0', transition: 'height 0.1s ease-out' }} />
            ))}
          </Box>
          
          {/* Tabela densa para estressar a reconciliação de 100 linhas e 500+ células */}
          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '70vh', borderRadius: 0 }}>
            <Table stickyHeader size="small" aria-label="dense financial table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ativo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Bid (Compra)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ask (Venda)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderBook.map((row) => {
                  const isUp = row.flash === 'up';
                  const isDown = row.flash === 'down';
                  // O CSS de transição garante um efeito de "fade out" mesmo que o estado flash dure 50ms
                  const bgColor = isUp 
                    ? 'rgba(76, 175, 80, 0.25)' // Verde Suave
                    : isDown 
                      ? 'rgba(244, 67, 54, 0.25)' // Vermelho Suave
                      : 'transparent';
                  
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.light' }}>{row.symbol}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{
                          backgroundColor: bgColor,
                          transition: 'background-color 0.15s ease-out',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }}
                      >
                        {row.bid}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{
                          backgroundColor: bgColor,
                          transition: 'background-color 0.15s ease-out',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }}
                      >
                        {row.ask}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>
                        {row.volume}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <OrderBookDashboard />
      <BenchmarkAnalyzer />
    </ThemeProvider>
  );
}
