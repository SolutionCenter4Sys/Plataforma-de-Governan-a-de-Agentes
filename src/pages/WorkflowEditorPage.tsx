import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, IconButton, Chip, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, FormControlLabel,
  Switch, Divider, Paper, Tooltip, alpha, useTheme,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { workflowApi } from '../services/api';
import { WorkflowCatalogEntry, WorkflowCatalogStep, WorkflowCatalogInput, MODULE_LABELS, MODULE_COLORS } from '../types';

/* ── Constantes ────────────────────────────────────────────────────────────── */
const CATEGORIES = ['Desenvolvimento', 'Planejamento', 'Arquitetura', 'Qualidade', 'Inovação', 'Análise', 'DevOps', 'Segurança', 'Colaboração'];
const RUN_COUNTS = ['once', 'per_feature', 'per_epic', 'per_us', 'loop'];
const RUN_COUNT_LABELS: Record<string, string> = {
  once: '1x — Uma vez',
  per_feature: 'Nx — Por Feature',
  per_epic: 'Nx — Por Épico',
  per_us: 'Nx — Por User Story',
  loop: 'Loop — Até aprovação',
};
const INPUT_TYPES = ['text', 'textarea', 'select'] as const;

const KNOWN_AGENTS = [
  'the-visionary', 'the-explorer', 'the-artista', 'the-critico', 'the-empresario',
  'the-arquiteta-estrategia-digital', 'the-gherkin', 'the-writer-front', 'the-writer-back',
  'the-data-master', 'the-data-forge', 'the-security-guardian', 'the-devops-master',
  'the-architect', 'the-architect-C4L4', 'the-designer-system',
  'dev-reactjs-esp', 'dev-dotnet-esp', 'dev-nodejs-esp', 'dev-angular-esp',
  'dev-java-esp', 'dev-flutter-esp', 'dev-android-esp', 'dev-ios-esp',
  'tech-lead-peer-review', 'pm', 'architect', 'analyst', 'dev',
];

const COMMON_ICONS = ['🎯','🔍','🏗️','🎨','🥒','🔒','📱','⚙️','📝','📊','💻','🚀','🌐','✅','🔄','💡','🗄️','👀','🧪','📋','🔐','🔑','📡','🧮','🤝','⭐','💬','🛡️','⚒️','🔬'];

const emptyWorkflow = (): WorkflowCatalogEntry => ({
  id: '',
  name: '',
  description: '',
  module: 'upstream',
  category: 'Desenvolvimento',
  icon: '⚡',
  color: '#FF5315',
  agents: [],
  steps: [],
  inputs: [
    { id: 'projectName',  label: 'Nome do Projeto', type: 'text',     required: true,  placeholder: 'ex: Meu Projeto' },
    { id: 'projectBrief', label: 'Contexto',         type: 'textarea', required: true,  placeholder: 'Descreva o projeto...' },
  ],
  type: 'bmad-workflow',
  estimatedTime: '1-2 horas',
  tags: [],
});

/* ── Tab panel ─────────────────────────────────────────────────────────────── */
interface TabPanelProps { children: React.ReactNode; value: number; index: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

/* ── helpers para multi-agente (armazena como "ag1+ag2" no JSON) ─────────── */
const agentStrToArr = (s: string): string[] =>
  s ? s.split(/[+,]/).map((a) => a.trim()).filter(Boolean) : [];

const agentArrToStr = (arr: string[]): string => arr.join('+');

/* ── Step Editor Row ───────────────────────────────────────────────────────── */
const StepRow: React.FC<{
  step: WorkflowCatalogStep;
  index: number;
  total: number;
  onChange: (s: WorkflowCatalogStep) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}> = ({ step, index, total, onChange, onDelete, onMove }) => {
  const theme = useTheme();
  const [showIcons, setShowIcons] = useState(false);

  const selectedAgents = agentStrToArr(step.agent);

  const handleAgentsChange = (values: string[]) => {
    onChange({ ...step, agent: agentArrToStr(values) });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1.5, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
      {/* Row header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Chip label={step.order} size="small" sx={{ fontWeight: 700, minWidth: 32 }} />
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>Step {step.order}</Typography>
        <Tooltip title="Mover para cima"><span>
          <IconButton size="small" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton>
        </span></Tooltip>
        <Tooltip title="Mover para baixo"><span>
          <IconButton size="small" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDownwardRoundedIcon fontSize="small" /></IconButton>
        </span></Tooltip>
        <Tooltip title="Remover step">
          <IconButton size="small" color="error" onClick={onDelete}><DeleteRoundedIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={1.5}>
        {/* Nome */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth size="small" label="Nome do Step"
            value={step.name}
            onChange={(e) => onChange({ ...step, name: e.target.value })}
          />
        </Grid>

        {/* Multi-select de Agentes */}
        <Grid item xs={12} sm={5}>
          <FormControl fullWidth size="small">
            <InputLabel>Agente(s)</InputLabel>
            <Select
              multiple
              value={selectedAgents}
              label="Agente(s)"
              onChange={(e) => handleAgentsChange(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((val) => (
                    <Chip
                      key={val}
                      label={val}
                      size="small"
                      onMouseDown={(e) => e.stopPropagation()}
                      onDelete={() => handleAgentsChange(selectedAgents.filter((a) => a !== val))}
                      sx={{ fontSize: '0.65rem', height: 20, maxWidth: 160 }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
            >
              {KNOWN_AGENTS.map((a) => (
                <MenuItem key={a} value={a} dense>
                  <Box
                    sx={{
                      width: 8, height: 8, borderRadius: '50%', mr: 1, flexShrink: 0,
                      bgcolor: selectedAgents.includes(a) ? 'primary.main' : 'transparent',
                      border: '1px solid',
                      borderColor: selectedAgents.includes(a) ? 'primary.main' : 'divider',
                    }}
                  />
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedAgents.length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {selectedAgents.length} agentes selecionados · salvo como: <code style={{ fontSize: '0.65rem' }}>{step.agent}</code>
            </Typography>
          )}
        </Grid>

        {/* Execução */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Execução</InputLabel>
            <Select
              value={step.run_count}
              label="Execução"
              onChange={(e) => onChange({ ...step, run_count: e.target.value })}
            >
              {RUN_COUNTS.map((r) => (
                <MenuItem key={r} value={r}>{RUN_COUNT_LABELS[r]}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Ícone */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">Ícone:</Typography>
            <Button
              size="small" variant="outlined"
              sx={{ minWidth: 40, fontSize: '1.1rem', py: 0.3 }}
              onClick={() => setShowIcons(!showIcons)}
            >
              {step.icon}
            </Button>
            {showIcons && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {COMMON_ICONS.map((ic) => (
                  <IconButton
                    key={ic} size="small"
                    sx={{ fontSize: '1rem', bgcolor: step.icon === ic ? alpha(theme.palette.primary.main, 0.2) : 'transparent' }}
                    onClick={() => { onChange({ ...step, icon: ic }); setShowIcons(false); }}
                  >
                    {ic}
                  </IconButton>
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

/* ── Input Editor Row ──────────────────────────────────────────────────────── */
const InputRow: React.FC<{
  input: WorkflowCatalogInput;
  index: number;
  total: number;
  onChange: (i: WorkflowCatalogInput) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}> = ({ input, index, total, onChange, onDelete, onMove }) => {
  const theme = useTheme();
  const [optionsText, setOptionsText] = useState((input.options ?? []).join('\n'));

  const handleOptionsBlur = () => {
    const opts = optionsText.split('\n').map((o) => o.trim()).filter(Boolean);
    onChange({ ...input, options: opts });
  };

  const autoId = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campo';

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1.5, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Chip label={index + 1} size="small" variant="outlined" sx={{ minWidth: 32 }} />
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          ID: <code>{input.id || autoId(input.label)}</code>
        </Typography>
        <Tooltip title="Mover para cima"><span>
          <IconButton size="small" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton>
        </span></Tooltip>
        <Tooltip title="Mover para baixo"><span>
          <IconButton size="small" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDownwardRoundedIcon fontSize="small" /></IconButton>
        </span></Tooltip>
        <Tooltip title="Remover campo">
          <IconButton size="small" color="error" onClick={onDelete}><DeleteRoundedIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth size="small" label="Label (nome visível)"
            value={input.label}
            onChange={(e) => onChange({ ...input, label: e.target.value, id: autoId(e.target.value) })}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={input.type}
              label="Tipo"
              onChange={(e) => onChange({ ...input, type: e.target.value as 'text' | 'textarea' | 'select' })}
            >
              {INPUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2}>
          <FormControlLabel
            control={<Switch checked={input.required} size="small" onChange={(e) => onChange({ ...input, required: e.target.checked })} />}
            label="Obrigatório"
            sx={{ mt: 0.5 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Placeholder"
            value={input.placeholder ?? ''}
            onChange={(e) => onChange({ ...input, placeholder: e.target.value })}
          />
        </Grid>
        {input.type === 'select' && (
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={3} size="small"
              label="Opções (uma por linha)"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              onBlur={handleOptionsBlur}
              placeholder={"Opção 1\nOpção 2\nOpção 3"}
            />
            <TextField
              fullWidth size="small" label="Valor padrão" sx={{ mt: 1 }}
              value={input.default ?? ''}
              onChange={(e) => onChange({ ...input, default: e.target.value })}
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export const WorkflowEditorPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';

  const [workflow, setWorkflow] = useState<WorkflowCatalogEntry>(emptyWorkflow());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [agentsInput, setAgentsInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      workflowApi.getWorkflow(id)
        .then((w) => {
          setWorkflow(w);
          setTagsInput(w.tags.join(', '));
          setAgentsInput(w.agents.join(', '));
        })
        .catch(() => setError('Workflow não encontrado'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const set = <K extends keyof WorkflowCatalogEntry>(key: K, val: WorkflowCatalogEntry[K]) =>
    setWorkflow((prev) => ({ ...prev, [key]: val }));

  /* ── Steps helpers ── */
  const addStep = () => {
    const newStep: WorkflowCatalogStep = {
      order: workflow.steps.length + 1,
      name: 'Novo Step',
      agent: 'the-visionary',
      run_count: 'once',
      icon: '⚡',
    };
    set('steps', [...workflow.steps, newStep]);
  };

  const updateStep = (idx: number, s: WorkflowCatalogStep) => {
    const steps = [...workflow.steps];
    steps[idx] = s;
    set('steps', steps.map((st, i) => ({ ...st, order: i + 1 })));
  };

  const deleteStep = (idx: number) => {
    const steps = workflow.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    set('steps', steps);
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const steps = [...workflow.steps];
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    set('steps', steps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  /* ── Inputs helpers ── */
  const addInput = () => {
    const newInput: WorkflowCatalogInput = {
      id: `campo${workflow.inputs.length + 1}`,
      label: 'Novo Campo',
      type: 'text',
      required: false,
      placeholder: '',
    };
    set('inputs', [...workflow.inputs, newInput]);
  };

  const updateInput = (idx: number, inp: WorkflowCatalogInput) => {
    const inputs = [...workflow.inputs];
    inputs[idx] = inp;
    set('inputs', inputs);
  };

  const deleteInput = (idx: number) => {
    set('inputs', workflow.inputs.filter((_, i) => i !== idx));
  };

  const moveInput = (idx: number, dir: -1 | 1) => {
    const inputs = [...workflow.inputs];
    const target = idx + dir;
    if (target < 0 || target >= inputs.length) return;
    [inputs[idx], inputs[target]] = [inputs[target], inputs[idx]];
    set('inputs', inputs);
  };

  /* ── Save ── */
  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!workflow.name.trim()) { setError('Nome é obrigatório'); setTab(0); return; }
    if (!workflow.id.trim()) { setError('ID é obrigatório'); setTab(0); return; }
    if (workflow.steps.length === 0) { setError('Adicione pelo menos um Step'); setTab(1); return; }

    const final: WorkflowCatalogEntry = {
      ...workflow,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      agents: agentsInput.split(',').map((a) => a.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      if (isNew) {
        await workflowApi.createWorkflow(final);
        setSuccess('Workflow criado com sucesso!');
      } else {
        await workflowApi.updateWorkflow(id!, final);
        setSuccess('Workflow salvo com sucesso!');
      }
      setWorkflow(final);
      setTimeout(() => navigate('/workflow'), 1200);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const moduleColor = MODULE_COLORS[workflow.module] ?? workflow.color;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/workflow')} sx={{ bgcolor: alpha(theme.palette.divider, 0.1) }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box sx={{ fontSize: '2rem', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(moduleColor, 0.15), borderRadius: 2 }}>
          {workflow.icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={800}>
            {isNew ? 'Novo Workflow' : `Editar: ${workflow.name}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isNew ? 'Crie um novo workflow personalizado' : `ID: ${workflow.id} · ${workflow.steps.length} steps`}
          </Typography>
        </Box>
        <Button
          variant="outlined" sx={{ mr: 1 }}
          onClick={() => navigate('/workflow')}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Salvando...' : isNew ? 'Criar Workflow' : 'Salvar Alterações'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="ℹ️ Informações Gerais" />
            <Tab label={`⚡ Steps (${workflow.steps.length})`} />
            <Tab label={`📋 Inputs (${workflow.inputs.length})`} />
            <Tab label="👁️ Preview" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* ── Tab 0: Info ── */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Nome do Workflow *"
                  value={workflow.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="ID único *"
                  value={workflow.id}
                  disabled={!isNew}
                  helperText={isNew ? 'Use kebab-case: meu-workflow. Não pode ser alterado após criar.' : 'ID não pode ser alterado'}
                  onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={2} label="Descrição"
                  value={workflow.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select value={workflow.category} label="Categoria" onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Módulo</InputLabel>
                  <Select value={workflow.module} label="Módulo" onChange={(e) => set('module', e.target.value)}>
                    {Object.entries(MODULE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth label="Ícone (emoji)"
                  value={workflow.icon}
                  onChange={(e) => set('icon', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ fontSize: '1.4rem' }}>{workflow.icon}</Box>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {COMMON_ICONS.slice(0, 10).map((ic) => (
                    <IconButton key={ic} size="small" sx={{ fontSize: '1rem' }} onClick={() => set('icon', ic)}>{ic}</IconButton>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth label="Cor (hex)"
                  value={workflow.color}
                  onChange={(e) => set('color', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: workflow.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  {['#FF5315','#1565C0','#2E7D32','#6A1B9A','#F9A825','#5C6BC0','#00897B','#E65100','#222239'].map((c) => (
                    <Box key={c} onClick={() => set('color', c)} sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: c, cursor: 'pointer', border: workflow.color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Tempo Estimado"
                  value={workflow.estimatedTime}
                  onChange={(e) => set('estimatedTime', e.target.value)}
                  placeholder="ex: 2-4 horas"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Tags (separadas por vírgula)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="ex: mvp, produto, end-to-end"
                  helperText={`${tagsInput.split(',').filter((t) => t.trim()).length} tag(s)`}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Agentes envolvidos (IDs separados por vírgula)"
                  value={agentsInput}
                  onChange={(e) => setAgentsInput(e.target.value)}
                  placeholder="ex: the-visionary, the-explorer, dev-reactjs-esp"
                  helperText="Apenas para referência — os agentes reais são definidos em cada Step"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Tab 1: Steps ── */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {workflow.steps.length} step(s) configurado(s)
              </Typography>
              <Button variant="outlined" size="small" startIcon={<AddRoundedIcon />} onClick={addStep}>
                Adicionar Step
              </Button>
            </Box>

            {workflow.steps.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                <Typography variant="body2" color="text.secondary">Nenhum step configurado</Typography>
                <Button sx={{ mt: 1 }} startIcon={<AddRoundedIcon />} onClick={addStep}>Adicionar primeiro step</Button>
              </Paper>
            ) : (
              workflow.steps.map((step, idx) => (
                <StepRow
                  key={idx}
                  step={step}
                  index={idx}
                  total={workflow.steps.length}
                  onChange={(s) => updateStep(idx, s)}
                  onDelete={() => deleteStep(idx)}
                  onMove={(dir) => moveStep(idx, dir)}
                />
              ))
            )}
          </TabPanel>

          {/* ── Tab 2: Inputs ── */}
          <TabPanel value={tab} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {workflow.inputs.length} campo(s) de entrada configurado(s)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Estes campos aparecem no formulário de execução do workflow
                </Typography>
              </Box>
              <Button variant="outlined" size="small" startIcon={<AddRoundedIcon />} onClick={addInput}>
                Adicionar Campo
              </Button>
            </Box>

            {workflow.inputs.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                <Typography variant="body2" color="text.secondary">Nenhum campo configurado</Typography>
                <Button sx={{ mt: 1 }} startIcon={<AddRoundedIcon />} onClick={addInput}>Adicionar primeiro campo</Button>
              </Paper>
            ) : (
              workflow.inputs.map((inp, idx) => (
                <InputRow
                  key={idx}
                  input={inp}
                  index={idx}
                  total={workflow.inputs.length}
                  onChange={(i) => updateInput(idx, i)}
                  onDelete={() => deleteInput(idx)}
                  onMove={(dir) => moveInput(idx, dir)}
                />
              ))
            )}
          </TabPanel>

          {/* ── Tab 3: Preview ── */}
          <TabPanel value={tab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                {/* Card preview */}
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Como aparece no catálogo:</Typography>
                <Card sx={{ border: `1px solid ${alpha(moduleColor, 0.4)}`, maxWidth: 340 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ fontSize: '1.8rem', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(moduleColor, 0.12), borderRadius: 2, flexShrink: 0 }}>
                        {workflow.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{workflow.name || 'Nome do Workflow'}</Typography>
                        <Chip label={MODULE_LABELS[workflow.module] ?? workflow.module} size="small" sx={{ bgcolor: alpha(moduleColor, 0.15), color: moduleColor, fontWeight: 600, fontSize: '0.65rem' }} />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                      {workflow.description || 'Descrição do workflow...'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                      {tagsInput.split(',').filter((t) => t.trim()).slice(0, 3).map((tag, i) => (
                        <Chip key={i} label={tag.trim()} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">⏱ {workflow.estimatedTime}</Typography>
                      <Typography variant="caption" color="text.secondary">⚡ {workflow.steps.length} steps</Typography>
                    </Box>
                  </CardContent>
                  <Box sx={{ px: 2.5, pb: 2 }}>
                    <Button fullWidth variant="contained" size="small" sx={{ bgcolor: moduleColor }}>Executar</Button>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Steps configurados:</Typography>
                {workflow.steps.map((s) => (
                  <Box key={s.order} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}` }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(moduleColor, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: moduleColor }}>{s.order}</Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{s.icon} {s.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.agent} · {RUN_COUNT_LABELS[s.run_count] ?? s.run_count}</Typography>
                    </Box>
                  </Box>
                ))}
                {workflow.steps.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Nenhum step ainda.</Typography>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Campos do formulário:</Typography>
                {workflow.inputs.map((inp, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Chip label={inp.type} size="small" variant="outlined" sx={{ fontSize: '0.6rem', minWidth: 56 }} />
                    <Typography variant="body2">{inp.label}</Typography>
                    {inp.required && <Chip label="obrigatório" size="small" color="primary" sx={{ fontSize: '0.55rem', height: 18 }} />}
                  </Box>
                ))}
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkflowEditorPage;
