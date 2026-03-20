import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, Stepper, Step, StepLabel, StepContent,
  Chip, CircularProgress, Alert, Divider,
  Select, MenuItem, FormControl, InputLabel,
  LinearProgress, Paper, alpha, useTheme,
  IconButton, Tooltip, Collapse, List, ListItem, ListItemButton,
  ListItemText, ListItemIcon, InputAdornment,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { workflowApi } from '../services/api';
import { WorkflowJob, WorkflowCatalogEntry } from '../types';
import { MODULE_LABELS, MODULE_COLORS } from '../types';

const CATEGORIES = ['Todos', 'Desenvolvimento', 'Planejamento', 'Arquitetura', 'Qualidade', 'Inovação', 'Análise', 'DevOps', 'Segurança', 'Colaboração'];

/* ── Catalog Card ─────────────────────────────────────────────────────────── */
const WorkflowCard: React.FC<{
  workflow: WorkflowCatalogEntry;
  onSelect: (w: WorkflowCatalogEntry) => void;
  onEdit: (w: WorkflowCatalogEntry) => void;
}> = ({ workflow, onSelect, onEdit }) => {
  const theme = useTheme();
  const moduleColor = MODULE_COLORS[workflow.module] ?? workflow.color;
  const moduleLabel = MODULE_LABELS[workflow.module] ?? workflow.module;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${alpha(moduleColor, 0.3)}`,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(moduleColor, 0.25)}`,
          borderColor: moduleColor,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              fontSize: '1.8rem',
              width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(moduleColor, 0.12),
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            {workflow.icon}
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>{workflow.name}</Typography>
            <Chip
              label={moduleLabel}
              size="small"
              sx={{ bgcolor: alpha(moduleColor, 0.15), color: moduleColor, fontWeight: 600, fontSize: '0.65rem', mt: 0.5 }}
            />
          </Box>
          <Tooltip title="Editar workflow">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(workflow); }}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {workflow.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {workflow.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20, borderColor: alpha(theme.palette.divider, 0.5) }} />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">{workflow.estimatedTime}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">{workflow.steps.length} steps</Typography>
          </Box>
        </Box>
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2, display: 'flex', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<PlayArrowRoundedIcon />}
          sx={{ bgcolor: moduleColor, '&:hover': { bgcolor: moduleColor, filter: 'brightness(1.1)' } }}
          onClick={() => onSelect(workflow)}
        >
          Executar
        </Button>
        <Tooltip title="Editar workflow">
          <Button
            variant="outlined"
            size="small"
            sx={{ minWidth: 36, px: 1, borderColor: alpha(moduleColor, 0.5), color: moduleColor, '&:hover': { borderColor: moduleColor } }}
            onClick={(e) => { e.stopPropagation(); onEdit(workflow); }}
          >
            <EditRoundedIcon fontSize="small" />
          </Button>
        </Tooltip>
      </Box>
    </Card>
  );
};

/* ── Dynamic Form ─────────────────────────────────────────────────────────── */
const WorkflowForm: React.FC<{
  workflow: WorkflowCatalogEntry;
  onBack: () => void;
}> = ({ workflow, onBack }) => {
  const theme = useTheme();
  const moduleColor = MODULE_COLORS[workflow.module] ?? workflow.color;

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    workflow.inputs.forEach((inp) => { defaults[inp.id] = inp.default ?? ''; });
    return defaults;
  });

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<WorkflowJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!jobId || !polling) return;
    intervalRef.current = setInterval(async () => {
      try {
        const j = await workflowApi.getJob(jobId);
        setJob(j);
        if (j.status === 'done' || j.status === 'error') {
          setPolling(false);
          clearInterval(intervalRef.current!);
          if (j.result && Object.keys(j.result).length > 0) {
            setSelectedStep(1);
          }
        }
      } catch { /* ignore */ }
    }, 1500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobId, polling]);

  const handleRun = async () => {
    setError('');
    const projectName = inputs['projectName']?.trim();
    if (!projectName) { setError('O campo "Nome do Projeto" é obrigatório'); return; }

    try {
      const res = await workflowApi.run({
        workflowId: workflow.id,
        projectName,
        inputs,
        startFromStep: 1,
      });
      setJobId(res.jobId);
      setJob(null);
      setSelectedStep(null);
      setPolling(true);
    } catch (e) {
      setError(String(e));
    }
  };

  const progress = job && job.totalSteps > 0
    ? Math.round((job.currentStep / job.totalSteps) * 100)
    : 0;

  const isRunning = job?.status === 'running';
  const isDone = job?.status === 'done';
  const isError = job?.status === 'error';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={onBack} sx={{ bgcolor: alpha(theme.palette.divider, 0.1) }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box
          sx={{
            fontSize: '2rem', width: 56, height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(moduleColor, 0.15), borderRadius: 2,
          }}
        >
          {workflow.icon}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>{workflow.name}</Typography>
          <Typography variant="body2" color="text.secondary">{workflow.description}</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={5}>
          <Card sx={{ border: `1px solid ${alpha(moduleColor, 0.3)}` }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Configurar Execução
              </Typography>

              {workflow.inputs.map((inp) => (
                <Box key={inp.id} sx={{ mb: 2 }}>
                  {inp.type === 'select' ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>{inp.label}{inp.required ? ' *' : ''}</InputLabel>
                      <Select
                        value={inputs[inp.id] ?? ''}
                        label={inp.label + (inp.required ? ' *' : '')}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [inp.id]: e.target.value }))}
                      >
                        {(inp.options ?? []).map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : inp.type === 'textarea' ? (
                    <TextField
                      fullWidth multiline rows={5}
                      label={inp.label + (inp.required ? ' *' : '')}
                      placeholder={inp.placeholder}
                      value={inputs[inp.id] ?? ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [inp.id]: e.target.value }))}
                      size="small"
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label={inp.label + (inp.required ? ' *' : '')}
                      placeholder={inp.placeholder}
                      value={inputs[inp.id] ?? ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [inp.id]: e.target.value }))}
                      size="small"
                    />
                  )}
                </Box>
              ))}

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button
                fullWidth variant="contained" size="large"
                startIcon={isRunning ? <CircularProgress size={18} color="inherit" /> : <PlayArrowRoundedIcon />}
                disabled={isRunning || polling}
                onClick={handleRun}
                sx={{ bgcolor: moduleColor, '&:hover': { bgcolor: moduleColor, filter: 'brightness(1.1)' } }}
              >
                {isRunning || polling ? 'Executando...' : 'Executar Workflow'}
              </Button>
            </CardContent>
          </Card>

          {/* Steps preview */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Steps do Workflow</Typography>
              {workflow.steps.map((step, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: i < workflow.steps.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none' }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(moduleColor, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: moduleColor }}>{step.order}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{step.icon} {step.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Agente: {step.agent}</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={7}>
          {/* Progress */}
          {(isRunning || isDone || isError) && job && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {isRunning ? `Executando: ${job.projectName}` : isDone ? `✅ Concluído: ${job.projectName}` : `❌ Erro: ${job.projectName}`}
                  </Typography>
                  <Chip
                    label={isRunning ? 'Em Andamento' : isDone ? 'Concluído' : 'Erro'}
                    size="small"
                    color={isRunning ? 'warning' : isDone ? 'success' : 'error'}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={isDone ? 100 : isError ? progress : progress}
                  color={isDone ? 'success' : isError ? 'error' : 'warning'}
                  sx={{ mb: 1, height: 6, borderRadius: 3 }}
                />

                <Typography variant="caption" color="text.secondary">
                  Step {job.currentStep} / {job.totalSteps} — {progress}%
                </Typography>

                {isError && job.error && (
                  <Alert severity="error" sx={{ mt: 1.5 }}>{job.error}</Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step Results */}
          {job?.result && Object.keys(job.result).length > 0 && (
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Resultados por Step
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {workflow.steps.map((step, i) => {
                    const key = `step${i + 1}`;
                    const done = !!job.result?.[key];
                    return (
                      <Chip
                        key={key}
                        label={`${step.icon} ${step.name}`}
                        size="small"
                        variant={selectedStep === i + 1 ? 'filled' : 'outlined'}
                        color={done ? 'success' : 'default'}
                        onClick={() => done && setSelectedStep(i + 1)}
                        sx={{ cursor: done ? 'pointer' : 'default', opacity: done ? 1 : 0.4 }}
                      />
                    );
                  })}
                </Box>

                {selectedStep !== null && job.result?.[`step${selectedStep}`] && (
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, maxHeight: 480, overflow: 'auto', bgcolor: alpha(theme.palette.background.default, 0.5) }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {workflow.steps[selectedStep - 1]?.icon} {workflow.steps[selectedStep - 1]?.name}
                    </Typography>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {job.result[`step${selectedStep}`]}
                    </ReactMarkdown>
                  </Paper>
                )}
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          {job?.logs && job.logs.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Log de Execução</Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, maxHeight: 200, overflow: 'auto', bgcolor: alpha(theme.palette.background.default, 0.8), fontFamily: 'monospace' }}
                >
                  {job.logs.map((log, i) => (
                    <Typography key={i} variant="caption" sx={{ display: 'block', lineHeight: 1.8, fontFamily: 'monospace', color: log.includes('❌') ? 'error.main' : log.includes('✅') ? 'success.main' : 'text.secondary' }}>
                      {log}
                    </Typography>
                  ))}
                </Paper>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!job && (
            <Card sx={{ border: `2px dashed ${alpha(theme.palette.divider, 0.4)}` }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ mb: 2 }}>{workflow.icon}</Typography>
                <Typography variant="h6" fontWeight={700} gutterBottom>Pronto para executar</Typography>
                <Typography variant="body2" color="text.secondary">
                  Preencha o formulário e clique em "Executar Workflow" para iniciar
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {workflow.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ bgcolor: alpha(moduleColor, 0.1), color: moduleColor }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export const WorkflowPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<WorkflowCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<WorkflowCatalogEntry | null>(null);

  useEffect(() => {
    workflowApi.getCatalog()
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = catalog.filter((w) => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.description.toLowerCase().includes(search.toLowerCase()) || w.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = category === 'Todos' || w.category === category;
    return matchSearch && matchCategory;
  });

  const grouped = CATEGORIES.slice(1).reduce<Record<string, WorkflowCatalogEntry[]>>((acc, cat) => {
    const items = filtered.filter((w) => w.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  if (selected) {
    return (
      <Box>
        <WorkflowForm workflow={selected} onBack={() => setSelected(null)} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            ⚡ Workflows
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {catalog.length} workflows disponíveis. Selecione um para configurar e executar.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate('/workflow/editor/new')}
          sx={{ flexShrink: 0 }}
        >
          Novo Workflow
        </Button>
      </Box>

      {/* Search & Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 240 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              onClick={() => setCategory(cat)}
              variant={category === cat ? 'filled' : 'outlined'}
              color={category === cat ? 'primary' : 'default'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">Nenhum workflow encontrado para os filtros aplicados.</Alert>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <Box key={cat} sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              {cat}
              <Chip label={items.length} size="small" sx={{ ml: 1, bgcolor: alpha(theme.palette.primary.main, 0.15) }} />
            </Typography>
            <Grid container spacing={2}>
              {items.map((w) => (
                <Grid item xs={12} sm={6} md={4} key={w.id}>
                  <WorkflowCard
                    workflow={w}
                    onSelect={setSelected}
                    onEdit={(wf) => navigate(`/workflow/editor/${wf.id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default WorkflowPage;
