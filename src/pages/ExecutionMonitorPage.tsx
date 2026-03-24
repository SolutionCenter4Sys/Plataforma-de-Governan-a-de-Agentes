import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams } from 'react-router-dom';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { useExecutionDetail } from '../hooks/useExecutionDetail';

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export const ExecutionMonitorPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: execution, loading, error, reload } = useExecutionDetail(id, { poll: true });
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  if (!id) {
    return <PageErrorState message="ID da execução não informado." />;
  }

  if (loading && !execution) {
    return <PageLoader height="60vh" />;
  }

  if (error && !execution) {
    return <PageErrorState message={error} onRetry={reload} />;
  }

  if (!execution) {
    return <PageErrorState message="Execução não encontrada." onRetry={reload} />;
  }

  const progress = execution.totalSteps > 0 ? Math.round((execution.currentStep / execution.totalSteps) * 100) : 0;
  const isRunning = execution.status === 'running';
  const isDone = execution.status === 'succeeded';
  const isError = execution.status === 'failed';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/workflow')} sx={{ bgcolor: alpha(theme.palette.divider, 0.1) }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800}>
            Monitor de Execução
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {execution.workflowName} · {execution.projectName}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        {isDone && (
          <Button
            variant="outlined"
            endIcon={<OpenInNewRoundedIcon />}
            onClick={() => navigate(`/results/${execution.id}`)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Ver resultados completos
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {isRunning ? `Executando: ${execution.projectName}` : isDone ? `Concluído: ${execution.projectName}` : `Erro: ${execution.projectName}`}
            </Typography>
            <Chip
              label={isRunning ? 'Em Andamento' : isDone ? 'Concluído' : 'Erro'}
              size="small"
              color={isRunning ? 'warning' : isDone ? 'success' : 'error'}
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={isDone ? 100 : progress}
            color={isDone ? 'success' : isError ? 'error' : 'warning'}
            sx={{ mb: 1.5, height: 6, borderRadius: 3 }}
          />

          <Box sx={{ display: 'flex', gap: '2px', height: 8, borderRadius: 2, overflow: 'hidden', mb: 1 }}>
            {execution.steps.map((step) => {
              const color =
                step.status === 'succeeded'
                  ? '#4CAF50'
                  : step.status === 'running'
                    ? '#FF9800'
                    : step.status === 'failed'
                      ? '#F44336'
                      : alpha('#fff', 0.08);

              return (
                <Tooltip key={step.id} title={`${step.label} — ${step.status}`}>
                  <Box sx={{ flex: 1, bgcolor: color }} />
                </Tooltip>
              );
            })}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Step {execution.currentStep} / {execution.totalSteps} · {progress}% · duração {formatDuration(execution.durationMs)}
          </Typography>

          {isError && execution.error && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {execution.error}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Timeline de Steps
          </Typography>
          {execution.steps.map((step, index) => {
            const isExpanded = expandedStep === step.id;
            const statusColor =
              step.status === 'succeeded'
                ? '#4CAF50'
                : step.status === 'running'
                  ? '#FF9800'
                  : step.status === 'failed'
                    ? '#F44336'
                    : alpha('#fff', 0.2);

            const statusIcon =
              step.status === 'succeeded'
                ? <CheckCircleRoundedIcon sx={{ fontSize: 18, color: statusColor }} />
                : step.status === 'running'
                  ? <CircularProgress size={16} sx={{ color: statusColor }} />
                  : step.status === 'failed'
                    ? <ErrorRoundedIcon sx={{ fontSize: 18, color: statusColor }} />
                    : <HourglassEmptyRoundedIcon sx={{ fontSize: 18, color: statusColor }} />;

            return (
              <Box key={step.id} sx={{ position: 'relative', pl: 3.5, pb: index < execution.steps.length - 1 ? 1 : 0 }}>
                {index < execution.steps.length - 1 && (
                  <Box sx={{ position: 'absolute', left: 10, top: 24, bottom: 0, width: 2, bgcolor: alpha(statusColor, 0.3) }} />
                )}
                <Box sx={{ position: 'absolute', left: 1, top: 2 }}>
                  {statusIcon}
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: alpha('#fff', 0.04) },
                  }}
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {step.label}
                      </Typography>
                      <Chip
                        label={step.status}
                        size="small"
                        sx={{ height: 18, fontSize: '9px', fontWeight: 700, bgcolor: alpha(statusColor, 0.12), color: statusColor }}
                      />
                      <Chip
                        label={step.type}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '9px', fontWeight: 700 }}
                      />
                    </Box>
                    {isExpanded ? <ExpandLessRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Duração: {formatDuration(step.durationMs)}
                  </Typography>
                </Box>

                <Collapse in={isExpanded}>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 1, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    {step.input && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>
                          Input
                        </Typography>
                        <Typography component="pre" variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap', m: 0 }}>
                          {JSON.stringify(step.input, null, 2)}
                        </Typography>
                      </Box>
                    )}
                    {step.markdown ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.markdown}</ReactMarkdown>
                    ) : (
                      <Typography component="pre" variant="body2" sx={{ fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap', m: 0 }}>
                        {step.output ? JSON.stringify(step.output, null, 2) : 'Sem output estruturado.'}
                      </Typography>
                    )}
                  </Paper>
                </Collapse>
              </Box>
            );
          })}
        </CardContent>
      </Card>

      {execution.logs.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Log de Execução
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, maxHeight: 240, overflow: 'auto', bgcolor: alpha(theme.palette.background.default, 0.8), fontFamily: 'monospace' }}
            >
              {execution.logs.map((log, index) => (
                <Typography
                  key={`${log}-${index}`}
                  variant="caption"
                  sx={{
                    display: 'block',
                    lineHeight: 1.8,
                    fontFamily: 'monospace',
                    color: log.includes('❌') ? 'error.main' : log.includes('✅') ? 'success.main' : 'text.secondary',
                  }}
                >
                  {log}
                </Typography>
              ))}
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
