import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    foursys: {
      marinho: string;
      laranja: string;
      baunilha: string;
      menta: string;
      marinhoLight: string;
    };
  }
  interface PaletteOptions {
    foursys?: {
      marinho?: string;
      laranja?: string;
      baunilha?: string;
      menta?: string;
      marinhoLight?: string;
    };
  }
}

const MARINHO = '#222239';
const LARANJA = '#FF5315';
const BAUNILHA = '#FFE2A9';
const MENTA = '#89BAB1';
const MARINHO_LIGHT = '#2d2d50';

export const foursysTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: LARANJA,
      light: '#FF7D47',
      dark: '#CC4210',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: MENTA,
      light: '#A8D5CD',
      dark: '#5E8F88',
      contrastText: MARINHO,
    },
    background: {
      default: '#161625',
      paper: MARINHO,
    },
    foursys: {
      marinho: MARINHO,
      laranja: LARANJA,
      baunilha: BAUNILHA,
      menta: MENTA,
      marinhoLight: MARINHO_LIGHT,
    },
    text: {
      primary: '#F5F5F5',
      secondary: '#B0BEC5',
    },
    divider: alpha('#FFFFFF', 0.08),
  },
  typography: {
    fontFamily: '"Nunito", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: '0.02em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(ellipse at 20% 20%, ${alpha(LARANJA, 0.04)} 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 80%, ${alpha(MENTA, 0.04)} 0%, transparent 50%)`,
        },
        '::-webkit-scrollbar': { width: '6px', height: '6px' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: alpha('#FFFFFF', 0.15),
          borderRadius: '3px',
          '&:hover': { background: alpha('#FFFFFF', 0.25) },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 32px ${alpha(LARANJA, 0.15)}`,
            borderColor: alpha(LARANJA, 0.3),
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingLeft: 20,
          paddingRight: 20,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${LARANJA} 0%, #FF7D47 100%)`,
          boxShadow: `0 4px 14px ${alpha(LARANJA, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, #FF7D47 0%, ${LARANJA} 100%)`,
            boxShadow: `0 6px 20px ${alpha(LARANJA, 0.5)}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Nunito", sans-serif', fontWeight: 600 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(LARANJA, 0.5),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: LARANJA,
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: MARINHO,
          borderRight: `1px solid ${alpha('#FFFFFF', 0.06)}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha(MARINHO, 0.95),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          boxShadow: 'none',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        bar: {
          background: `linear-gradient(90deg, ${LARANJA} 0%, #FF7D47 100%)`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});
