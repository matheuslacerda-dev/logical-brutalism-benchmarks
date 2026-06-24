'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dabf5', // Vivid blue for high tech feel
    },
    secondary: {
      main: '#f50057', // Accent pink/red
    },
    background: {
      default: '#0a0e17', // Very dark blue/grey
      paper: '#131b2f',
    },
    success: {
      main: '#00e676',
    },
    warning: {
      main: '#ff9100',
    },
    error: {
      main: '#ff1744',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13, // Smaller base size for high density
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '6px 16px', // High density rows
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#0a0e17',
          color: '#8f9bb3',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
      },
    },
  },
});

export default theme;
