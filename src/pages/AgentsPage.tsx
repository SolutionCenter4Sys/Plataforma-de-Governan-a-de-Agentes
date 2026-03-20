import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, TextField, InputAdornment,
  ToggleButtonGroup, ToggleButton, CircularProgress,
  alpha, useTheme,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useNavigate } from 'react-router-dom';
import { AgentCard } from '../components/AgentCard/AgentCard';
import { agentsApi } from '../services/api';
import { Agent, MODULE_LABELS } from '../types';

export const AgentsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  useEffect(() => {
    agentsApi.list()
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const modules = ['all', ...new Set(agents.map(a => a.module))];

  const filtered = agents.filter(a => {
    const matchSearch = !search || [a.name, a.title, a.role, a.module]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchModule = moduleFilter === 'all' || a.module === moduleFilter;
    return matchSearch && matchModule;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Agentes BMAD
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {agents.length} agentes disponíveis em {modules.length - 1} módulos
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar agente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
        <ToggleButtonGroup
          value={moduleFilter}
          exclusive
          onChange={(_, v) => v && setModuleFilter(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              fontWeight: 700, fontSize: '12px', textTransform: 'none',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
            },
          }}
        >
          <ToggleButton value="all">Todos</ToggleButton>
          {modules.filter(m => m !== 'all').map(m => (
            <ToggleButton key={m} value={m}>
              {MODULE_LABELS[m] || m}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '48px', mb: 2 }}>🔍</Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Nenhum agente encontrado
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map(agent => (
            <Grid item key={agent.id} xs={12} sm={6} md={4} lg={3}>
              <AgentCard
                agent={agent}
                onChat={a => navigate(`/chat?agent=${a.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
