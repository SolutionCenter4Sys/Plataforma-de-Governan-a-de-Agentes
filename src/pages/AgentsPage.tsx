import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Grid, Typography, TextField, InputAdornment,
  ToggleButtonGroup, ToggleButton,
  alpha, useTheme, Button,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';
import { AgentCard } from '../components/AgentCard/AgentCard';
import { AgentDialog } from '../components/AgentDialog/AgentDialog';
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { useAgentsList } from '../hooks/useAgentsList';
import { managedAgentsApi, specsApi } from '../services/api';
import { Agent, ManagedAgent, Spec, MODULE_LABELS } from '../types';

export const AgentsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: agents, loading: agentsLoading, error: agentsError, reload: reloadAgents } = useAgentsList();
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<ManagedAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([reloadAgents(), specsApi.list()])
      .then(([, specList]) => {
        setSpecs(specList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar agentes.'))
      .finally(() => setLoading(false));
  }, [reloadAgents]);

  useEffect(() => { loadData(); }, [loadData]);

  const modules = ['all', ...new Set(agents.map(a => a.module))];

  const filtered = agents.filter(a => {
    const matchSearch = !search || [a.name, a.title, a.role, a.module]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchModule = moduleFilter === 'all' || a.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const handleNewAgent = () => {
    setEditAgent(null);
    setDialogOpen(true);
  };

  const handleEditAgent = async (agent: Agent) => {
    try {
      const full = await managedAgentsApi.get(agent.id);
      setEditAgent(full);
      setDialogOpen(true);
    } catch {
      const partial: ManagedAgent = {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        specId: '',
        promptTemplate: '',
        inputSchema: null,
        outputSchema: null,
        createdAt: '',
        updatedAt: '',
      };
      setEditAgent(partial);
      setDialogOpen(true);
    }
  };

  const handleDeleteAgent = (agent: Agent) => setDeleteTarget(agent);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await managedAgentsApi.delete(deleteTarget.id);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  if (loading || agentsLoading) return <PageLoader />;
  if (error || agentsError) return <PageErrorState message={error || agentsError} onRetry={loadData} />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Agentes BMAD
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {agents.length} agentes disponíveis em {modules.length - 1} módulos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleNewAgent}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Novo Agente
        </Button>
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
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Agent CRUD Dialog */}
      <AgentDialog
        open={dialogOpen}
        agent={editAgent}
        specs={specs}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          loadData();
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover agente"
        message={`Tem certeza que deseja remover o agente "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
