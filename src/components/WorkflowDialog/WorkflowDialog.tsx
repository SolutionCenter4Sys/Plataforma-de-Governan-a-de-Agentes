import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box,
  Typography, Select, MenuItem, FormControl, InputLabel, IconButton,
  Paper, Chip, alpha, useTheme, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { ManagedWorkflow, ManagedAgent, WorkflowStepConfig } from '../../types';
import { managedWorkflowsApi } from '../../services/api';

interface StepUI {
  type: 'llm' | 'parallel';
  agentId: string;
  branches: { agentId: string; outputKey?: string }[];
}

interface WorkflowDialogProps {
  open: boolean;
  workflow?: ManagedWorkflow | null;
  agents: ManagedAgent[];
  onClose: () => void;
  onSaved: () => void;
}

export const WorkflowDialog: React.FC<WorkflowDialogProps> = ({ open, workflow, agents, onClose, onSaved }) => {
  const theme = useTheme();
  const isEdit = !!workflow;
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [steps, setSteps] = useState<StepUI[]>([{ type: 'llm', agentId: '', branches: [] }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (workflow) {
      setName(workflow.name ?? '');
      setVersion(workflow.version ?? '1.0.0');
      setSteps((workflow.steps ?? []).map(s => {
        if (s.config.type === 'parallel') {
          return { type: 'parallel' as const, agentId: '', branches: s.config.branches };
        }
        return { type: 'llm' as const, agentId: s.config.agentId, branches: [] };
      }));
    } else {
      setName(''); setVersion('1.0.0');
      setSteps([{ type: 'llm', agentId: '', branches: [] }]);
    }
  }, [open, workflow]);

  const addStep = () => setSteps(p => [...p, { type: 'llm', agentId: '', branches: [] }]);
  const removeStep = (i: number) => setSteps(p => p.filter((_, idx) => idx !== i));

  const updateStepType = (i: number, type: 'llm' | 'parallel') =>
    setSteps(p => { const n = [...p]; n[i] = { ...n[i], type, branches: type === 'parallel' ? [{ agentId: '' }] : [] }; return n; });

  const updateStepAgent = (i: number, agentId: string) =>
    setSteps(p => { const n = [...p]; n[i] = { ...n[i], agentId }; return n; });

  const addBranch = (i: number) =>
    setSteps(p => { const n = [...p]; n[i] = { ...n[i], branches: [...n[i].branches, { agentId: '' }] }; return n; });

  const removeBranch = (i: number, bi: number) =>
    setSteps(p => { const n = [...p]; n[i] = { ...n[i], branches: n[i].branches.filter((_, idx) => idx !== bi) }; return n; });

  const updateBranch = (i: number, bi: number, field: 'agentId' | 'outputKey', v: string) =>
    setSteps(p => { const n = [...p]; const b = [...n[i].branches]; b[bi] = { ...b[bi], [field]: v }; n[i] = { ...n[i], branches: b }; return n; });

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        name: name.trim(),
        version: version.trim() || '1.0.0',
        steps: steps.map((s, i) => ({
          order: i + 1,
          type: s.type,
          config: s.type === 'parallel'
            ? { type: 'parallel' as const, branches: s.branches }
            : { type: 'llm' as const, agentId: s.agentId },
        })),
      };
      if (isEdit && workflow) {
        await managedWorkflowsApi.update(workflow.id, payload);
      } else {
        await managedWorkflowsApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const sxField = { bgcolor: alpha(theme.palette.background.default, 0.5) };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <AccountTreeRoundedIcon sx={{ color: '#4CAF50' }} />
        {isEdit ? 'Editar Workflow' : 'Novo Workflow'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Nome" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} sx={sxField} />
          <TextField label="Versão" size="small" value={version} onChange={e => setVersion(e.target.value)} sx={{ width: 130, ...sxField }} InputProps={{ sx: { fontFamily: 'monospace' } }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight={700}>Steps</Typography>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={addStep}>Step</Button>
        </Box>

        {steps.map((step, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip label={`#${i + 1}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
              <ToggleButtonGroup size="small" exclusive value={step.type} onChange={(_, v) => v && updateStepType(i, v)} sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '12px', py: 0.3, px: 1.5 } }}>
                <ToggleButton value="llm">LLM</ToggleButton>
                <ToggleButton value="parallel">Parallel</ToggleButton>
              </ToggleButtonGroup>
              <Box sx={{ flex: 1 }} />
              <IconButton size="small" color="error" onClick={() => removeStep(i)} disabled={steps.length <= 1}><DeleteRoundedIcon fontSize="small" /></IconButton>
            </Box>

            {step.type === 'llm' ? (
              <FormControl fullWidth size="small">
                <InputLabel>Agente</InputLabel>
                <Select value={step.agentId} label="Agente" onChange={e => updateStepAgent(i, e.target.value)} sx={sxField}>
                  {agents.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {step.branches.map((br, bi) => (
                  <Box key={bi} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Agente</InputLabel>
                      <Select value={br.agentId} label="Agente" onChange={e => updateBranch(i, bi, 'agentId', e.target.value)} sx={sxField}>
                        {agents.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField size="small" label="outputKey" value={br.outputKey ?? ''} onChange={e => updateBranch(i, bi, 'outputKey', e.target.value)} sx={{ width: 140, ...sxField }} />
                    <IconButton size="small" color="error" onClick={() => removeBranch(i, bi)} disabled={step.branches.length <= 1}><DeleteRoundedIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
                <Button size="small" onClick={() => addBranch(i)}>+ Branch</Button>
              </Box>
            )}
          </Paper>
        ))}

        {error && <Typography variant="body2" color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}>
          {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Workflow'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
