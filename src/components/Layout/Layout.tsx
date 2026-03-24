import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Chip, Divider, alpha, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import CircleIcon from '@mui/icons-material/Circle';
import { useNavigate, useLocation } from 'react-router-dom';

/* ── Logo SVG — rede neural minimalista nas cores Foursys ──────────────────── */
const AgentesLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logo_bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF5315" />
        <stop offset="100%" stopColor="#C73D0A" />
      </linearGradient>
      <linearGradient id="logo_node_glow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFE2A9" />
        <stop offset="100%" stopColor="#FF8C5A" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Fundo arredondado */}
    <rect width="40" height="40" rx="11" fill="url(#logo_bg)" />

    {/* Connections — camada input (3 nós) → camada output (2 nós) */}
    {/* input top → output top */}
    <line x1="10" y1="10" x2="30" y2="15" stroke="white" strokeWidth="1" strokeOpacity="0.35" />
    {/* input top → output bottom */}
    <line x1="10" y1="10" x2="30" y2="25" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
    {/* input mid → output top */}
    <line x1="10" y1="20" x2="30" y2="15" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
    {/* input mid → output bottom */}
    <line x1="10" y1="20" x2="30" y2="25" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
    {/* input bot → output top */}
    <line x1="10" y1="30" x2="30" y2="15" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
    {/* input bot → output bottom */}
    <line x1="10" y1="30" x2="30" y2="25" stroke="white" strokeWidth="1" strokeOpacity="0.35" />

    {/* Nós de entrada */}
    <circle cx="10" cy="10" r="2.8" fill="white" fillOpacity="0.6" />
    <circle cx="10" cy="20" r="2.8" fill="white" fillOpacity="0.9" />
    <circle cx="10" cy="30" r="2.8" fill="white" fillOpacity="0.6" />

    {/* Nós de saída (com brilho) */}
    <circle cx="30" cy="15" r="3.4" fill="url(#logo_node_glow)" filter="url(#glow)" />
    <circle cx="30" cy="25" r="3.4" fill="url(#logo_node_glow)" filter="url(#glow)" />

    {/* Ponto central de ênfase — o "agente orquestrador" */}
    <circle cx="10" cy="20" r="1.4" fill="#FFE2A9" />
  </svg>
);

const DRAWER_WIDTH = 256;

interface NavGroup {
  title: string;
  items: { label: string; path: string; icon: React.ReactNode }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Operação',
    items: [
      { label: 'Dashboard', path: '/', icon: <DashboardRoundedIcon /> },
      { label: 'Agentes', path: '/agents', icon: <SmartToyRoundedIcon /> },
      { label: 'Workflows', path: '/workflow', icon: <AutoAwesomeRoundedIcon /> },
      { label: 'Chat', path: '/chat', icon: <ChatRoundedIcon /> },
    ],
  },
  {
    title: 'Governança',
    items: [
      { label: 'Painel Admin', path: '/admin', icon: <AdminPanelSettingsRoundedIcon /> },
      { label: 'Observabilidade', path: '/observability', icon: <MonitorHeartRoundedIcon /> },
      { label: 'Versões', path: '/versioning', icon: <HistoryRoundedIcon /> },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configurações', path: '/settings', icon: <SettingsRoundedIcon /> },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
  mockMode?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, mockMode = true }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          {/* Logo SVG profissional */}
          <Box sx={{ flexShrink: 0, filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.55)})` }}>
            <AgentesLogo size={40} />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: '-0.3px',
                background: `linear-gradient(90deg, #FFFFFF 0%, ${alpha('#FFE2A9', 0.9)} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Agentes AI
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#89BAB1', 0.85),
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              Foursys Platform
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<CircleIcon sx={{ fontSize: '8px !important', color: mockMode ? '#FFC107 !important' : '#4CAF50 !important' }} />}
          label={mockMode ? 'Modo Mock' : 'LLM Ativo'}
          size="small"
          sx={{
            mt: 1, height: 22, fontSize: '10px', fontWeight: 700,
            bgcolor: mockMode ? alpha('#FFC107', 0.1) : alpha('#4CAF50', 0.1),
            color: mockMode ? '#FFC107' : '#4CAF50',
            border: `1px solid ${mockMode ? alpha('#FFC107', 0.3) : alpha('#4CAF50', 0.3)}`,
          }}
        />
      </Box>

      <Divider sx={{ borderColor: alpha('#fff', 0.06), mx: 2 }} />

      {/* Navigation */}
      <Box sx={{ px: 1.5, py: 1, flex: 1, overflow: 'auto' }}>
        {NAV_GROUPS.map((group, gi) => (
          <Box key={group.title}>
            {gi > 0 && <Divider sx={{ borderColor: alpha('#fff', 0.04), my: 1, mx: 0.5 }} />}
            <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: alpha('#fff', 0.3), fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {group.title}
            </Typography>
            <List disablePadding>
              {group.items.map(item => {
                const active = location.pathname === item.path
                  || (item.path !== '/' && location.pathname.startsWith(item.path))
                  || (item.path === '/workflow' && (location.pathname.startsWith('/executions/') || location.pathname.startsWith('/results/')));
                return (
                  <ListItem key={`${group.title}-${item.path}`} disablePadding sx={{ mb: 0.3 }}>
                    <ListItemButton
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      sx={{
                        borderRadius: 2,
                        px: 1.5, py: 0.8,
                        bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                        borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: active ? theme.palette.primary.main : 'text.secondary' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '13px',
                          fontWeight: active ? 700 : 500,
                          color: active ? 'text.primary' : 'text.secondary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'center' }}>
          BMAD Method v6.0 · Foursys © 2026
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar mobile */}
      <AppBar position="fixed" sx={{ display: { md: 'none' }, zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Agentes AI</Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>

      {/* Sidebar Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          mt: { xs: '56px', md: 0 },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
