'use client';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/system';
import StorageIcon from '@mui/icons-material/Storage';

const pulseAnimation = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
`;

export default function Header() {
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Listen for custom events dispatched by the data fetcher
  useEffect(() => {
    const handleSync = () => {
      setLastSync(new Date());
    };
    window.addEventListener('DATA_SYNC', handleSync);
    return () => {
      window.removeEventListener('DATA_SYNC', handleSync);
    };
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      p: 2, 
      borderBottom: '1px solid #333',
      backgroundColor: '#121212'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <StorageIcon sx={{ color: '#2979ff' }} />
        <Typography variant="h6" sx={{ letterSpacing: 0.5 }}>
          SERVER CONTROL CENTER - MaterialDesign
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#00e676',
            animation: `${pulseAnimation} 2s infinite ease-in-out`
          }} />
          <Typography variant="body2" sx={{ color: '#00e676', fontWeight: 'bold', letterSpacing: 1 }}>
            [STREAM_ACTIVE]
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Last Sync: {lastSync.toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
}
