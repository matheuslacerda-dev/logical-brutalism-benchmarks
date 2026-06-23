'use client';

import React, { useState, Profiler, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button,
  AppBar,
  Toolbar,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Search, TrendingUp, TrendingDown, Trash2, Activity } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = async (url: string) => {
  const isQuote = url.includes('type=quote');
  const markName = isQuote ? `widget-update-${Date.now()}` : `chart-update-${Date.now()}`;
  performance.mark(`${markName}-start`);
  const res = await fetch(url);
  const data = await res.json();
  performance.mark(`${markName}-end`);
  performance.measure(markName, `${markName}-start`, `${markName}-end`);
  return data;
};

function onRenderCallback(
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  performance.measure(`react-render-${id}-${phase}-${Date.now()}`, { 
    start: startTime, 
    duration: actualDuration 
  });
}

export default function Dashboard() {
  const [tickers, setTickers] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', '^BVSP']);
  const [newTicker, setNewTicker] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('AAPL');

  useEffect(() => {
    performance.measure('dashboard_mount_ms', { start: 0, end: performance.now() });
  }, []);

  // Fetch real-time quotes, polling every 5 seconds
  const { data: quoteData, error: quoteError } = useSWR(
    tickers.length > 0 ? `/api/finance?tickers=${tickers.join(',')}&type=quote` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // Fetch historical data for the selected ticker
  const { data: historicalData, error: historicalError } = useSWR(
    selectedTicker ? `/api/finance?tickers=${selectedTicker}&type=historical` : null,
    fetcher
  );

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicker && !tickers.includes(newTicker.toUpperCase())) {
      setTickers([...tickers, newTicker.toUpperCase()]);
      setNewTicker('');
    }
  };

  const handleRemoveTicker = (tickerToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTickers = tickers.filter(t => t !== tickerToRemove);
    setTickers(newTickers);
    if (selectedTicker === tickerToRemove && newTickers.length > 0) {
      setSelectedTicker(newTickers[0]);
    } else if (newTickers.length === 0) {
      setSelectedTicker('');
    }
  };

  // Process historical data for chart
  const chartData = historicalData?.historical?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    price: item.close
  })) || [];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Toolbar>
          <Activity color="#7C3AED" size={28} style={{ marginRight: '12px' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Material Design
          </Typography>
          <Box component="form" onSubmit={handleAddTicker} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add Ticker..."
              variant="outlined"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              sx={{ input: { color: 'white' }, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              sx={{ minWidth: '40px', padding: '8px' }}
            >
              <Search size={20} />
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {quoteError && <Typography color="error">Failed to load quotes</Typography>}
        
        {/* Summary Cards */}
        <Profiler id="widgets" onRender={onRenderCallback}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {tickers.length === 0 && (
            <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'text.secondary' }}>
              No tickers added. Search above to add one.
            </Typography>
          )}
          
          {!quoteData && !quoteError && tickers.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {quoteData?.quotes?.map((quote: any) => {
            if (!quote) return null;
            const isSelected = selectedTicker === quote.symbol;
            const isPositive = quote.regularMarketChangePercent >= 0;
            
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={quote.symbol}>
                <Card 
                  onClick={() => setSelectedTicker(quote.symbol)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.05)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    '&:hover': {
                      borderColor: '#7C3AED',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>{quote.symbol}</Typography>
                      <IconButton size="small" onClick={(e) => handleRemoveTicker(quote.symbol, e)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {quote.shortName || quote.longName}
                    </Typography>
                    
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      ${quote.regularMarketPrice?.toFixed(2)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isPositive ? 'secondary.main' : 'error.main' }}>
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {quote.regularMarketChange?.toFixed(2)} ({quote.regularMarketChangePercent?.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        </Profiler>

        {/* Historical Chart */}
        <Profiler id="charts" onRender={onRenderCallback}>
        {selectedTicker && (
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                {selectedTicker} - 30 Day History
              </Typography>
              
              <Box sx={{ width: '100%', height: 400 }}>
                {!historicalData && !historicalError ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94A3B8" 
                        tick={{ fill: '#94A3B8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        stroke="#94A3B8"
                        tick={{ fill: '#94A3B8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#7C3AED', fontWeight: 600 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#7C3AED" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
        </Profiler>
      </Container>
    </Box>
  );
}
