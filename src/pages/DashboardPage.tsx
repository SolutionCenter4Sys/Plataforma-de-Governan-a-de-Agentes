import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Avatar, List, ListItem, ListItemAvatar, ListItemText,
  LinearProgress, Button, alpha, useTheme, CircularProgress, Tooltip,
} from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import { useNavigate } from 'react-router-dom';
import { agentsApi, workflowApi } from '../services/api';
import { Agent, WorkflowJob, WorkflowCatalogEntry } from '../types';

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode;
  color: string; subtitle?: string;
}> = ({ label, value, icon, color, subtitle }) => {
  const theme = useTheme();
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(color, 0.12),
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

function buildAgentRanking(
  catalog: WorkflowCatalogEntry[],
  jobs: WorkflowJob[],
  agents: Agent[],
) {
  const freq: Record<string, number> = {};

  catalog.forEach((wf) => {
    // weight = max(1, número de execuções desse workflow)
    const weight = Math.max(1, jobs.filter((j) => j.workflowId === wf.id).length);
    wf.steps.forEach((step) => {
      step.agent
        .split(/[+,]/)
        .map((a) => a.trim())
        .filter(Boolean)
        .forEach((agentId) => {
          freq[agentId] = (freq[agentId] ?? 0) + weight;
        });
    });
  });

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([agentId, count]) => ({
      agentId,
      count,
      meta: agents.find((a) => a.id === agentId),
    }));
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [catalog, setCatalog] = useState<WorkflowCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([agentsApi.list(), workflowApi.getAllJobs(), workflowApi.getCatalog()])
      .then(([agentList, jobList, catalogList]) => {
        setAgents(agentList);
        setJobs(jobList);
        setCatalog(catalogList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const moduleCount = [...new Set(agents.map((a) => a.module))].length;
  const completedJobs = jobs.filter((j) => j.status === 'done').length;
  const runningJobs = jobs.filter((j) => j.status === 'running').length;

  const topAgents = buildAgentRanking(catalog, jobs, agents);
  const maxCount = topAgents[0]?.count ?? 1;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Hero */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Plataforma de Agentes AI
          </Typography>
          <Chip
            label="BMAD v6.0"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              color: theme.palette.primary.main,
              fontWeight: 700, fontSize: '11px',
            }}
          />
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
          Orquestre agentes BMAD usando Anthropic, OpenAI ou modo Mock — sem expor detalhes técnicos ao usuário final.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Agentes Disponíveis"
            value={agents.length}
            icon={<SmartToyRoundedIcon />}
            color={theme.palette.primary.main}
            subtitle={`${moduleCount} módulos`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Workflows na Plataforma"
            value={catalog.length}
            icon={<AccountTreeRoundedIcon />}
            color="#9C27B0"
            subtitle={`${completedJobs} execuções concluídas`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Jobs Ativos"
            value={runningJobs}
            icon={<PlayArrowRoundedIcon />}
            color="#4CAF50"
            subtitle="em execução"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Taxa de Sucesso"
            value={jobs.length > 0 ? `${Math.round((completedJobs / jobs.length) * 100)}%` : '—'}
            icon={<CheckCircleRoundedIcon />}
            color="#2196F3"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Agentes mais utilizados */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsRoundedIcon sx={{ color: '#FFB300', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Agentes mais utilizados</Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate('/agents')}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Ver todos
                </Button>
              </Box>

              {topAgents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '28px', mb: 1 }}>🤖</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum workflow cadastrado ainda.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {topAgents.map(({ agentId, count, meta }, idx) => (
                    <ListItem
                      key={agentId}
                      disablePadding
                      sx={{
                        borderRadius: 2, mb: 1,
                        '&:hover': { bgcolor: alpha('#fff', 0.04), cursor: 'pointer' },
                        px: 1, py: 0.75,
                      }}
                      onClick={() => navigate(`/chat?agent=${agentId}`)}
                    >
                      {/* posição */}
                      <Box sx={{ width: 28, textAlign: 'center', flexShrink: 0, mr: 0.5 }}>
                        {idx < 3 ? (
                          <Typography sx={{ fontSize: '16px', lineHeight: 1 }}>{MEDAL[idx]}</Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                            #{idx + 1}
                          </Typography>
                        )}
                      </Box>

                      {/* avatar */}
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 34, height: 34, borderRadius: '8px',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            fontSize: '16px',
                          }}
                        >
                          {meta?.icon ?? '🤖'}
                        </Avatar>
                      </ListItemAvatar>

                      {/* nome + barra */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {meta?.name ?? agentId}
                          </Typography>
                          <Tooltip title={`${count} aparição${count !== 1 ? 'ões' : ''} nos workflows`}>
                            <Chip
                              label={count}
                              size="small"
                              sx={{ height: 18, fontSize: '10px', fontWeight: 700, ml: 1, flexShrink: 0, bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }}
                            />
                          </Tooltip>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(count / maxCount) * 100}
                          sx={{
                            height: 4, borderRadius: 4,
                            bgcolor: alpha('#fff', 0.05),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: idx === 0 ? '#FFB300' : idx === 1 ? alpha('#FFB300', 0.65) : idx === 2 ? alpha('#FFB300', 0.4) : theme.palette.primary.main,
                            },
                          }}
                        />
                        {meta?.title && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                            {meta.title}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}

              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', display: 'block', mt: 1.5, textAlign: 'right' }}
              >
                Baseado em {catalog.length} workflow{catalog.length !== 1 ? 's' : ''} · {jobs.length} execuç{jobs.length !== 1 ? 'ões' : 'ão'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Start + Jobs */}
        <Grid item xs={12} md={7}>
          {/* Quick Start */}
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha('#9C27B0', 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                🚀 Iniciar Workflow Produção MVP
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Execute os 5 steps (Épicos → Features → WSJF → User Stories → Dev) com agentes BMAD orquestrados automaticamente.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/workflow')}
                  startIcon={<AutoAwesomeRoundedIcon />}
                >
                  Executar Workflow
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/agents')}
                  startIcon={<SmartToyRoundedIcon />}
                >
                  Explorar Agentes
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Execuções Recentes
              </Typography>
              {jobs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '32px', mb: 1 }}>🎯</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Nenhum workflow executado ainda.
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/workflow')}
                    sx={{ mt: 1, fontWeight: 700 }}
                  >
                    Começar agora
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {jobs.slice(0, 4).map(job => (
                    <ListItem
                      key={job.id}
                      disablePadding
                      sx={{ borderRadius: 2, mb: 1, px: 1.5, py: 1, bgcolor: alpha('#fff', 0.03) }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        {job.status === 'done' ? (
                          <CheckCircleRoundedIcon sx={{ color: '#4CAF50' }} />
                        ) : job.status === 'error' ? (
                          <ErrorRoundedIcon sx={{ color: '#F44336' }} />
                        ) : (
                          <CircularProgress size={20} color="primary" />
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={job.projectName}
                        secondary={`Step ${job.currentStep}/${job.totalSteps} · ${new Date(job.startedAt).toLocaleString('pt-BR')}`}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '14px' }}
                        secondaryTypographyProps={{ fontSize: '11px' }}
                      />
                      {job.status === 'running' && (
                        <Box sx={{ width: 80 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(job.currentStep / job.totalSteps) * 100}
                            color="primary"
                          />
                        </Box>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
