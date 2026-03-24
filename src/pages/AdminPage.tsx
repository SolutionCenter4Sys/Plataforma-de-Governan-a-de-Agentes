import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Button, IconButton,
  Chip, CircularProgress, alpha, useTheme, Tooltip,
} from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { specsApi, managedAgentsApi, managedWorkflowsApi } from '../services/api';
import { Spec, ManagedAgent, ManagedWorkflow } from '../types';
import { SpecDialog } from '../components/SpecDialog/SpecDialog';
import { AgentDialog } from '../components/AgentDialog/AgentDialog';
import { WorkflowDialog } from '../components/WorkflowDialog/WorkflowDialog';
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog';

export const AdminPage: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [agents, setAgents] = useState<ManagedAgent[]>([]);
  const [workflows, setWorkflows] = useState<ManagedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [specToEdit, setSpecToEdit] = useState<Spec | null>(null);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<ManagedAgent | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [workflowToEdit, setWorkflowToEdit] = useState<ManagedWorkflow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'spec' | 'agent' | 'workflow'; id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [s, a, w] = await Promise.all([specsApi.list(), managedAgentsApi.list(), managedWorkflowsApi.list()]);
      setSpecs(s); setAgents(a); setWorkflows(w);
    } catch { /* silently handle */ }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const requestDelete = (kind: 'spec' | 'agent' | 'workflow', id: string, label: string) => {
    setDeleteTarget({ kind, id, label });
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'spec') await specsApi.delete(deleteTarget.id);
      else if (deleteTarget.kind === 'agent') await managedAgentsApi.delete(deleteTarget.id);
      else await managedWorkflowsApi.delete(deleteTarget.id);
      await reload();
    } catch { /* silently handle */ }
    setDeleting(false);
    setDeleteOpen(false);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Painel Admin</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Gerencie Specs, Agentes e Workflows</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Specs" />
        <Tab icon={<SmartToyRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Agentes" />
        <Tab icon={<AccountTreeRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Workflows" />
      </Tabs>

      {/* Tab Specs */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{specs.length} specs</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => { setSpecToEdit(null); setSpecDialogOpen(true); }}
              sx={{ bgcolor: alpha('#9C27B0', 0.1), color: '#9C27B0', border: `1px solid ${alpha('#9C27B0', 0.3)}`, '&:hover': { bgcolor: alpha('#9C27B0', 0.2) } }}>
              Nova Spec
            </Button>
          </Box>
          {specs.map(spec => (
            <Card key={spec.id} sx={{ '&:hover .admin-actions': { opacity: 1 } }}>
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionRoundedIcon sx={{ color: '#9C27B0', fontSize: 18 }} />
                    <Typography variant="body1" fontWeight={600}>{spec.name}</Typography>
                    <Chip label={`v${spec.version}`} size="small" sx={{ fontSize: '10px', fontFamily: 'monospace', height: 20 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>{spec.description ?? '—'}</Typography>
                </Box>
                <Box className="admin-actions" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                  <Tooltip title="Editar"><IconButton size="small" onClick={() => { setSpecToEdit(spec); setSpecDialogOpen(true); }}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Remover"><IconButton size="small" color="error" onClick={() => requestDelete('spec', spec.id, spec.name)}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tab Agentes */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{agents.length} agentes</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => { setAgentToEdit(null); setAgentDialogOpen(true); }}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
              Novo Agente
            </Button>
          </Box>
          {agents.map(agent => (
            <Card key={agent.id} sx={{ '&:hover .admin-actions': { opacity: 1 } }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToyRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                    <Typography variant="body1" fontWeight={600}>{agent.name}</Typography>
                    <Chip label="ativo" size="small" sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', fontSize: '10px', fontFamily: 'monospace', height: 20 }} />
                  </Box>
                  <Box className="admin-actions" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => { setAgentToEdit(agent); setAgentDialogOpen(true); }}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Remover"><IconButton size="small" color="error" onClick={() => requestDelete('agent', agent.id, agent.name)}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mt: 1, ml: 3.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LinkRoundedIcon sx={{ fontSize: 12 }} /> {agent.spec?.name ?? agent.specId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    in: {agent.inputFields?.length ?? 0} campo{(agent.inputFields?.length ?? 0) !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    out: {agent.outputBlocks?.filter(b => b.enabled !== false).length ?? 0} bloco{(agent.outputBlocks?.filter(b => b.enabled !== false).length ?? 0) !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tab Workflows */}
      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{workflows.length} workflows</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => { setWorkflowToEdit(null); setWorkflowDialogOpen(true); }}
              sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', border: `1px solid ${alpha('#4CAF50', 0.3)}`, '&:hover': { bgcolor: alpha('#4CAF50', 0.2) } }}>
              Novo Workflow
            </Button>
          </Box>
          {workflows.map(wf => (
            <Card key={wf.id} sx={{ '&:hover .admin-actions': { opacity: 1 } }}>
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountTreeRoundedIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
                    <Typography variant="body1" fontWeight={600}>{wf.name}</Typography>
                    <Chip label={`v${wf.version}`} size="small" sx={{ fontSize: '10px', fontFamily: 'monospace', height: 20 }} />
                    <Chip label="ativo" size="small" sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', fontSize: '10px', fontFamily: 'monospace', height: 20 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5, fontFamily: 'monospace' }}>{wf.steps?.length ?? 0} passos</Typography>
                </Box>
                <Box className="admin-actions" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                  <Tooltip title="Editar"><IconButton size="small" onClick={() => { setWorkflowToEdit(wf); setWorkflowDialogOpen(true); }}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Remover"><IconButton size="small" color="error" onClick={() => requestDelete('workflow', wf.id, wf.name)}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <SpecDialog open={specDialogOpen} spec={specToEdit} onClose={() => setSpecDialogOpen(false)} onSaved={reload} />
      <AgentDialog open={agentDialogOpen} agent={agentToEdit} specs={specs} onClose={() => setAgentDialogOpen(false)} onSaved={reload} />
      <WorkflowDialog open={workflowDialogOpen} workflow={workflowToEdit} agents={agents} onClose={() => setWorkflowDialogOpen(false)} onSaved={reload} />
      <ConfirmDialog open={deleteOpen} message={deleteTarget ? `Tem certeza que deseja remover "${deleteTarget.label}"? Essa ação não pode ser desfeita.` : ''} loading={deleting} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
};
