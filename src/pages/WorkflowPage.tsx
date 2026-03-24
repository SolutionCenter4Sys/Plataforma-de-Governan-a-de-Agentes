import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, Chip, CircularProgress, Alert, Divider,
  Select, MenuItem, FormControl, InputLabel,
  LinearProgress, Paper, alpha, useTheme,
  IconButton, Tooltip, Collapse, InputAdornment,
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
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { workflowApi, managedAgentsApi } from '../services/api';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { useWorkflowCatalog } from '../hooks/useWorkflowCatalog';
import { WorkflowJob, WorkflowCatalogEntry, InputField } from '../types';
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

/* ── Classification color helper ──────────────────────────────────────── */
const classificationColor = (c: string) => {
  if (c === 'OBRIGATORIO') return '#F44336';
  if (c === 'DESEJAVEL') return '#FF9800';
  return '#9E9E9E';
};

interface WorkflowAgentField extends InputField {
  agentId: string;
  agentName: string;
  key: string;
}

function parseAgentFieldValue(field: WorkflowAgentField, rawValue: string): unknown {
  if (rawValue === '') return '';
  if (field.dataType === 'Número') return Number(rawValue);
  if (field.dataType === 'JSON') return JSON.parse(rawValue);
  return rawValue;
}

function isBlockingField(field: WorkflowAgentField): boolean {
  if (field.behaviorIfAbsent === 'ASSUME') return false;
  return field.classification === 'OBRIGATORIO' || field.behaviorIfAbsent === 'BLOCK' || field.behaviorIfAbsent === 'ASK' || field.behaviorIfAbsent === 'MENU';
}

/* ── Dynamic Form ─────────────────────────────────────────────────────────── */
const WorkflowForm: React.FC<{
  workflow: WorkflowCatalogEntry;
  onBack: () => void;
}> = ({ workflow, onBack }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const moduleColor = MODULE_COLORS[workflow.module] ?? workflow.color;

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    workflow.inputs.forEach((inp) => { defaults[inp.id] = inp.default ?? ''; });
    return defaults;
  });

  const [jsonMode, setJsonMode] = useState(false);
  const [jsonRaw, setJsonRaw] = useState('');
  const [agentInputFields, setAgentInputFields] = useState<WorkflowAgentField[]>([]);
  const [agentFieldValues, setAgentFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    const firstStepAgent = workflow.steps[0]?.agent;
    if (!firstStepAgent) return;
    const agentIds = firstStepAgent.split(/[+,]/).map(a => a.trim()).filter(Boolean);
    Promise.all(agentIds.map(id => managedAgentsApi.get(id).catch(() => null)))
      .then(results => {
        const fields: WorkflowAgentField[] = [];
        const defaults: Record<string, string> = {};
        results.forEach(agent => {
          if (agent?.inputFields) {
            agent.inputFields.forEach((field, index) => {
              const key = `${agent.id}::${field.name || `field_${index + 1}`}`;
              fields.push({
                ...field,
                agentId: agent.id,
                agentName: agent.name,
                key,
              });
              if (field.behaviorIfAbsent === 'ASSUME' && field.defaultOrFallback) {
                defaults[key] = field.defaultOrFallback;
              }
            });
          }
        });
        setFieldErrors({});
        setAgentFieldValues((prev) => ({ ...defaults, ...prev }));
        setAgentInputFields(fields);
      })
      .catch(() => {
        setFieldErrors({});
        setAgentInputFields([]);
      });
  }, [workflow]);

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

  const buildAgentFieldPayload = () => {
    if (agentInputFields.length === 0) return {};
    return agentInputFields.reduce<Record<string, Record<string, unknown>>>((acc, field) => {
      const rawValue = agentFieldValues[field.key] ?? '';
      if (!rawValue) return acc;
      if (!acc[field.agentId]) acc[field.agentId] = {};
      try {
        acc[field.agentId][field.name] = parseAgentFieldValue(field, rawValue);
      } catch {
        acc[field.agentId][field.name] = rawValue;
      }
      return acc;
    }, {});
  };

  const validateAgentFields = () => {
    const nextErrors: Record<string, string> = {};

    agentInputFields.forEach((field) => {
      const rawValue = (agentFieldValues[field.key] ?? '').trim();

      if (!rawValue) {
        if (isBlockingField(field)) {
          nextErrors[field.key] = `O campo "${field.name}" precisa ser preenchido.`;
        }
        return;
      }

      if (field.dataType === 'Número' && Number.isNaN(Number(rawValue))) {
        nextErrors[field.key] = `O campo "${field.name}" precisa ser numérico.`;
      }

      if (field.dataType === 'JSON') {
        try {
          JSON.parse(rawValue);
        } catch {
          nextErrors[field.key] = `O campo "${field.name}" precisa conter JSON válido.`;
        }
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const agentFields = buildAgentFieldPayload();
    const payload: Record<string, unknown> = {
      workflowId: workflow.id,
      projectName: inputs['projectName'] ?? '',
      inputs: { ...inputs },
    };
    if (Object.keys(agentFields).length > 0) {
      payload.agentFields = agentFields;
    }
    return payload;
  };

  const toggleJsonMode = () => {
    if (!jsonMode) {
      setJsonRaw(JSON.stringify(buildPayload(), null, 2));
    }
    setJsonMode(!jsonMode);
  };

  const handleRun = async () => {
    setError('');
    setFieldErrors({});

    let runInputs = inputs;
    let projectName = inputs['projectName']?.trim() ?? '';
    let runAgentFields = buildAgentFieldPayload();

    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonRaw);
        runInputs = parsed.inputs ?? parsed;
        projectName = parsed.projectName ?? projectName;
        runAgentFields = parsed.agentFields ?? runAgentFields;
      } catch {
        setError('JSON inválido. Verifique a sintaxe.');
        return;
      }
    }

    if (!projectName) { setError('O campo "Nome do Projeto" é obrigatório'); return; }
    if (!jsonMode && !validateAgentFields()) {
      setError('Corrija os campos destacados dos agentes antes de executar.');
      return;
    }

    try {
      const res = await workflowApi.run({
        workflowId: workflow.id,
        projectName,
        inputs: runInputs,
        agentFields: runAgentFields,
        startFromStep: 1,
      });
      setJobId(res.jobId);
      setJob(null);
      setSelectedStep(null);
      setPolling(true);
      navigate(`/executions/${res.jobId}`);
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Configurar Execução
                </Typography>
                <Tooltip title={jsonMode ? 'Modo Formulário' : 'Modo JSON'}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={jsonMode ? <ViewListRoundedIcon /> : <CodeRoundedIcon />}
                    onClick={toggleJsonMode}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '11px' }}
                  >
                    {jsonMode ? 'Formulário' : 'JSON'}
                  </Button>
                </Tooltip>
              </Box>

              {jsonMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={14}
                  value={jsonRaw}
                  onChange={(e) => setJsonRaw(e.target.value)}
                  size="small"
                  sx={{
                    mb: 2,
                    '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '12px' },
                  }}
                />
              ) : (
                <>
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

                  {/* Agent Input Fields from first step */}
                  {agentInputFields.length > 0 && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Campos dos Agentes
                      </Typography>
                      {Object.entries(agentInputFields.reduce<Record<string, WorkflowAgentField[]>>((acc, field) => {
                        if (!acc[field.agentId]) acc[field.agentId] = [];
                        acc[field.agentId].push(field);
                        return acc;
                      }, {})).map(([agentId, fields]) => (
                        <Box key={agentId} sx={{ mb: 2.5 }}>
                          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>
                            {fields[0]?.agentName}
                          </Typography>
                          {fields.map((field) => (
                            <Box key={field.key} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label={field.classification}
                                  size="small"
                                  sx={{
                                    height: 18, fontSize: '9px', fontWeight: 700,
                                    bgcolor: alpha(classificationColor(field.classification), 0.12),
                                    color: classificationColor(field.classification),
                                  }}
                                />
                                {field.dataType && (
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                                    {field.dataType}
                                  </Typography>
                                )}
                                {field.behaviorIfAbsent && (
                                  <Chip label={field.behaviorIfAbsent} size="small" variant="outlined" sx={{ height: 18, fontSize: '9px', fontWeight: 700 }} />
                                )}
                                {isBlockingField(field) && !(agentFieldValues[field.key] ?? '') && (
                                  <Tooltip title="Campo obrigatório para prosseguir com a execução">
                                    <WarningAmberRoundedIcon sx={{ fontSize: 14, color: '#F44336' }} />
                                  </Tooltip>
                                )}
                              </Box>
                              {field.dataType === 'Seleção' || field.behaviorIfAbsent === 'MENU' ? (
                                <FormControl fullWidth size="small" error={!!fieldErrors[field.key]}>
                                  <InputLabel>{field.name}</InputLabel>
                                  <Select
                                    value={agentFieldValues[field.key] ?? ''}
                                    label={field.name}
                                    onChange={(e) => setAgentFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                  >
                                    {(field.options ?? []).map((option) => (
                                      <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={field.name}
                                  placeholder={field.validExample ?? field.description ?? ''}
                                  helperText={
                                    fieldErrors[field.key]
                                      ?? (
                                        field.behaviorIfAbsent === 'ASSUME' && field.defaultOrFallback
                                          ? `Padrão: ${field.defaultOrFallback}`
                                          : field.description ?? undefined
                                      )
                                  }
                                  error={!!fieldErrors[field.key]}
                                  value={agentFieldValues[field.key] ?? ''}
                                  onChange={(e) => setAgentFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                  multiline={field.dataType === 'Texto longo' || field.dataType === 'JSON'}
                                  rows={field.dataType === 'Texto longo' || field.dataType === 'JSON' ? 3 : undefined}
                                  type={field.dataType === 'Número' ? 'number' : 'text'}
                                />
                              )}
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}

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

              {/* Payload Preview */}
              {!jsonMode && (
                <Collapse in={Object.values(inputs).some(v => !!v) || Object.values(agentFieldValues).some(v => !!v)}>
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 2, p: 1.5,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      maxHeight: 180, overflow: 'auto',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Payload JSON
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'pre-wrap', m: 0 }}
                    >
                      {JSON.stringify(buildPayload(), null, 2)}
                    </Typography>
                  </Paper>
                </Collapse>
              )}
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
          {/* Progress + Segmented Bar */}
          {(isRunning || isDone || isError) && job && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {isRunning ? `Executando: ${job.projectName}` : isDone ? `Concluído: ${job.projectName}` : `Erro: ${job.projectName}`}
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
                  sx={{ mb: 1.5, height: 6, borderRadius: 3 }}
                />

                {/* Segmented progress bar — one colored segment per step */}
                <Box sx={{ display: 'flex', gap: '2px', height: 8, borderRadius: 2, overflow: 'hidden', mb: 1 }}>
                  {workflow.steps.map((step, i) => {
                    const stepNum = i + 1;
                    const stepDone = !!job.result?.[`step${stepNum}`];
                    const stepRunning = job.currentStep === stepNum && isRunning;
                    const stepError = job.currentStep === stepNum && isError;
                    const color = stepDone ? '#4CAF50' : stepRunning ? '#FF9800' : stepError ? '#F44336' : alpha('#fff', 0.08);
                    return (
                      <Tooltip key={i} title={`${step.name} — ${stepDone ? 'Concluído' : stepRunning ? 'Executando' : stepError ? 'Erro' : 'Pendente'}`}>
                        <Box sx={{ flex: 1, bgcolor: color, transition: 'background-color 0.3s' }} />
                      </Tooltip>
                    );
                  })}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Step {job.currentStep} / {job.totalSteps} — {progress}%
                </Typography>

                {isError && job.error && (
                  <Alert severity="error" sx={{ mt: 1.5 }}>{job.error}</Alert>
                )}

                {/* Link to full results */}
                {isDone && (
                  <Button
                    size="small"
                    endIcon={<OpenInNewRoundedIcon />}
                    onClick={() => navigate(`/results/${job.id}`)}
                    sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700 }}
                  >
                    Ver resultados completos
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Expandable Timeline per Step */}
          {(isRunning || isDone || isError) && job && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Timeline de Steps
                </Typography>
                {workflow.steps.map((step, i) => {
                  const stepNum = i + 1;
                  const key = `step${stepNum}`;
                  const stepDone = !!job.result?.[key];
                  const stepRunning = job.currentStep === stepNum && isRunning;
                  const stepError = job.currentStep === stepNum && isError;
                  const isExpanded = selectedStep === stepNum;
                  const statusColor = stepDone ? '#4CAF50' : stepRunning ? '#FF9800' : stepError ? '#F44336' : alpha('#fff', 0.2);
                  const statusIcon = stepDone
                    ? <CheckCircleRoundedIcon sx={{ fontSize: 18, color: statusColor }} />
                    : stepRunning
                      ? <CircularProgress size={16} sx={{ color: statusColor }} />
                      : stepError
                        ? <ErrorRoundedIcon sx={{ fontSize: 18, color: statusColor }} />
                        : <HourglassEmptyRoundedIcon sx={{ fontSize: 18, color: statusColor }} />;

                  return (
                    <Box key={i} sx={{ position: 'relative', pl: 3.5, pb: i < workflow.steps.length - 1 ? 1 : 0 }}>
                      {i < workflow.steps.length - 1 && (
                        <Box sx={{ position: 'absolute', left: 10, top: 24, bottom: 0, width: 2, bgcolor: alpha(statusColor, 0.3) }} />
                      )}
                      <Box sx={{ position: 'absolute', left: 1, top: 2 }}>
                        {statusIcon}
                      </Box>
                      <Box
                        sx={{
                          cursor: stepDone ? 'pointer' : 'default',
                          p: 1, borderRadius: 1.5,
                          '&:hover': stepDone ? { bgcolor: alpha('#fff', 0.04) } : {},
                        }}
                        onClick={() => stepDone && setSelectedStep(isExpanded ? null : stepNum)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{step.icon} {step.name}</Typography>
                            <Chip
                              label={stepDone ? 'Concluído' : stepRunning ? 'Executando' : stepError ? 'Erro' : 'Pendente'}
                              size="small"
                              sx={{ height: 18, fontSize: '9px', fontWeight: 700, bgcolor: alpha(statusColor, 0.12), color: statusColor }}
                            />
                          </Box>
                          {stepDone && (
                            isExpanded
                              ? <ExpandLessRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              : <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">Agente: {step.agent}</Typography>
                      </Box>

                      <Collapse in={isExpanded && stepDone}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, mt: 1, mb: 1, maxHeight: 360, overflow: 'auto', bgcolor: alpha(theme.palette.background.default, 0.5) }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {job.result?.[key] ?? ''}
                          </ReactMarkdown>
                        </Paper>
                      </Collapse>
                    </Box>
                  );
                })}
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
  const { data: catalog, loading, error, reload } = useWorkflowCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<WorkflowCatalogEntry | null>(null);

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
        <PageLoader height="40vh" />
      ) : error ? (
        <PageErrorState message={error} onRetry={reload} />
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
