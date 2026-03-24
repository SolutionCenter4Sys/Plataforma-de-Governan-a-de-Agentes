import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Paper, Chip,
  LinearProgress, CircularProgress, Alert, alpha, useTheme, Collapse, IconButton,
} from '@mui/material';
import TerminalRoundedIcon from '@mui/icons-material/TerminalRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import { observabilityApi } from '../services/api';
import { ObservabilityLog, ObservabilityLogLevel, ObservabilityStats } from '../types';

const LEVEL_CONFIG: Record<ObservabilityLogLevel, { icon: React.ReactNode; color: string; label: string }> = {
  info: { icon: <InfoRoundedIcon sx={{ fontSize: 14 }} />, color: '#2196F3', label: 'Info' },
  warn: { icon: <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />, color: '#FFC107', label: 'Warning' },
  error: { icon: <BugReportRoundedIcon sx={{ fontSize: 14 }} />, color: '#F44336', label: 'Erro' },
  debug: { icon: <TerminalRoundedIcon sx={{ fontSize: 14 }} />, color: '#9E9E9E', label: 'Debug' },
  decision: { icon: <PsychologyRoundedIcon sx={{ fontSize: 14 }} />, color: '#9C27B0', label: 'Decisão' },
};

export const ObservabilityPage: React.FC = () => {
  const theme = useTheme();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logs, setLogs] = useState<ObservabilityLog[]>([]);
  const [stats, setStats] = useState<ObservabilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [logsData, statsData] = await Promise.all([
        observabilityApi.getLogs({ level: filter as ObservabilityLogLevel | 'all', search: debouncedSearch, limit: 200 }),
        observabilityApi.getStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    }
    setLoading(false);
  }, [debouncedSearch, filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const statCards = [
    { label: 'Total Logs', value: stats?.total ?? 0, icon: <TerminalRoundedIcon />, color: theme.palette.text.primary },
    { label: 'Decisões IA', value: stats?.decisions ?? 0, icon: <PsychologyRoundedIcon />, color: '#9C27B0' },
    { label: 'Warnings', value: stats?.warnings ?? 0, icon: <WarningAmberRoundedIcon />, color: '#FFC107' },
    { label: 'Erros', value: stats?.errors ?? 0, icon: <BugReportRoundedIcon />, color: '#F44336' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Observabilidade</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Logs, decisões de agentes e rastreamento de execuções</Typography>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {statCards.map(stat => (
          <Card key={stat.label}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, fontFamily: 'monospace' }}>{stat.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth size="small" placeholder="Buscar logs..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filtrar</InputLabel>
          <Select value={filter} label="Filtrar" onChange={e => setFilter(e.target.value)}>
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="decision">Decisões</MenuItem>
            <MenuItem value="warn">Warnings</MenuItem>
            <MenuItem value="error">Erros</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Log Stream */}
      <Paper variant="outlined">
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${alpha('#fff', 0.06)}`, bgcolor: alpha('#fff', 0.02) }}>
          <FiberManualRecordRoundedIcon sx={{ fontSize: 8, color: '#4CAF50', animation: 'pulse 2s infinite' }} />
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>Stream ao Vivo</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{logs.length} entradas</Typography>
        </Box>

        {loading && <Box sx={{ p: 3 }}><CircularProgress size={20} /></Box>}
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {!loading && logs.map(log => {
          const config = LEVEL_CONFIG[log.level];
          const isExpanded = expandedLog === log.id;
          const hasDetails = !!log.decision || !!log.details;

          return (
            <Box key={log.id} sx={{ borderBottom: `1px solid ${alpha('#fff', 0.04)}` }}>
              <Box
                onClick={() => hasDetails && setExpandedLog(isExpanded ? null : log.id)}
                sx={{
                  px: 2.5, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 2,
                  cursor: hasDetails ? 'pointer' : 'default',
                  '&:hover': { bgcolor: alpha('#fff', 0.02) },
                  transition: 'background 0.15s',
                }}
              >
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled', width: 160, flexShrink: 0, mt: 0.3 }}>{log.timestamp}</Typography>
                <Chip
                  icon={config.icon as React.ReactElement}
                  label={config.label}
                  size="small"
                  sx={{ bgcolor: alpha(config.color, 0.1), color: config.color, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, height: 22, minWidth: 80 }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', width: 100, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.3 }}>{log.agent}</Typography>
                <Typography variant="body2" sx={{ flex: 1, color: log.level === 'error' ? 'error.main' : log.level === 'warn' ? '#FFC107' : 'text.primary', fontSize: '13px' }}>{log.message}</Typography>
                {log.stepName && <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled', flexShrink: 0 }}>{log.stepName}</Typography>}
                {hasDetails && (
                  <IconButton size="small" sx={{ mt: -0.5 }}>
                    {isExpanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                  </IconButton>
                )}
              </Box>

              <Collapse in={isExpanded && !!log.decision}>
                {log.decision && (
                  <Box sx={{ px: 2.5, pb: 2.5, ml: '180px' }}>
                    <Box sx={{ borderLeft: `2px solid ${alpha('#9C27B0', 0.3)}`, pl: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Paper sx={{ p: 2, bgcolor: alpha('#9C27B0', 0.05), border: `1px solid ${alpha('#9C27B0', 0.15)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PsychologyRoundedIcon sx={{ fontSize: 16, color: '#9C27B0' }} />
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#9C27B0' }}>Raciocínio do Agente</Typography>
                          <Box sx={{ flex: 1 }} />
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#9C27B0' }}>
                            Confiança: {log.decision.confidence <= 1 ? Math.round(log.decision.confidence * 100) : Math.round(log.decision.confidence)}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{log.decision.reasoning}</Typography>
                      </Paper>

                      {log.decision.alternatives.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>Alternativas Descartadas</Typography>
                          {log.decision.alternatives.map((alt, ai) => (
                            <Box key={ai} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <FiberManualRecordRoundedIcon sx={{ fontSize: 6, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">{alt}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Score de Confiança</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#9C27B0' }}>
                            {log.decision.confidence <= 1 ? Math.round(log.decision.confidence * 100) : Math.round(log.decision.confidence)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={log.decision.confidence <= 1 ? log.decision.confidence * 100 : log.decision.confidence}
                          sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#9C27B0', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#9C27B0', borderRadius: 3 } }}
                        />
                      </Box>
                    </Box>
                  </Box>
                )}
              </Collapse>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
};
