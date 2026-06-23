'use client';

import React from 'react';
import { Box, Typography, Grid, Paper, AppBar, Toolbar, IconButton, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { InventoryTable } from '@/components/InventoryTable/InventoryTable';
import { OrderTicker } from '@/components/OrderTicker/OrderTicker';
import { TurnoverChart } from '@/components/Dashboard/TurnoverChart';
import { ActionBar } from '@/components/Filters/ActionBar';

export default function Home() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <AppBar position="static" color="transparent" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundImage: 'none' }}>
        <Toolbar variant="dense">
          <DashboardIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6" color="inherit" component="div" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.1rem' }}>
            InventoryERP 
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, mx: 1 }}>[ Material Design ]</Box>
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.9rem' }}>Matriz de Alta Densidade</Box>
          </Typography>
          <IconButton color="inherit" size="small" sx={{ mr: 1 }}>
            <NotificationsIcon fontSize="small" />
          </IconButton>
          <IconButton color="inherit" size="small" sx={{ mr: 2 }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.8rem' }}>A</Avatar>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', gap: 2, overflow: 'hidden' }}>
        
        {/* Left Column (Table and Actions) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <ActionBar />
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <InventoryTable />
          </Box>
        </Box>

        {/* Right Column (Sidebar for Chart and Ticker) */}
        <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          {/* Turnover Chart */}
          <Box sx={{ height: 250, flexShrink: 0 }}>
            <TurnoverChart />
          </Box>

          {/* Order Ticker */}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <OrderTicker />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
