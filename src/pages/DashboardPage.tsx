import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Avatar, List, ListItem, ListItemAvatar, ListItemText,
  LinearProgress, Button, alpha, useTheme, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import { useNavigate } from 'react-router-dom';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { useAgentsList } from '../hooks/useAgentsList';
import { workflowApi } from '../services/api';
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

function formatDuration(ms: number | null): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m}m ${rest}s` : `${m}m`;
}

function computeJobDuration(job: WorkflowJob): string {
  if (!job.startedAt) return '—';
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now();
  return formatDuration(end - new Date(job.startedAt).getTime());
}

function computeExecutionStats(jobs: WorkflowJob[]) {
  const today = new Date().toDateString();
  const todayCount = jobs.filter(j => new Date(j.startedAt).toDateString() === today).length;
  const completed = jobs.filter(j => j.status === 'done').length;
  const failed = jobs.filter(j => j.status === 'error').length;
  const completedWithTime = jobs.filter(j => j.status === 'done' && j.startedAt && j.finishedAt);
  const totalMs = completedWithTime.reduce((acc, j) => {
    return acc + (new Date(j.finishedAt!).getTime() - new Date(j.startedAt).getTime());
  }, 0);
  const avgMs = completedWithTime.length ? Math.round(totalMs / completedWithTime.length) : 0;
  return { todayCount, completed, failed, avgDuration: formatDuration(avgMs || null) };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  done: { label: 'Concluído', color: '#4CAF50' },
  running: { label: 'Executando', color: '#FF9800' },
  pending: { label: 'Pendente', color: '#9E9E9E' },
  error: { label: 'Erro', color: '#F44336' },
};

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };
const SYNTHETIC_USERS = [
  { id: 'usr-marina', name: 'Marina Costa', initials: 'MC', area: 'Operacoes', color: '#FF7043' },
  { id: 'usr-lucas', name: 'Lucas Ferreira', initials: 'LF', area: 'Produto', color: '#29B6F6' },
  { id: 'usr-amanda', name: 'Amanda Silva', initials: 'AS', area: 'Arquitetura', color: '#AB47BC' },
  { id: 'usr-rafael', name: 'Rafael Souza', initials: 'RS', area: 'Engenharia', color: '#66BB6A' },
  { id: 'usr-julia', name: 'Julia Martins', initials: 'JM', area: 'Governanca', color: '#FFA726' },
] as const;

type UserRankingEntry = {
  user: (typeof SYNTHETIC_USERS)[number];
  executionCount: number;
  agentRunsEstimate: number;
  successCount: number;
  lastExecutionAt: string | null;
};

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function countAgentsInWorkflow(workflow?: WorkflowCatalogEntry): number {
  if (!workflow) return 0;
  return workflow.steps.reduce((total, step) => {
    const count = step.agent
      .split(/[+,]/)
      .map((agentId) => agentId.trim())
      .filter(Boolean)
      .length;
    return total + Math.max(1, count);
  }, 0);
}

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

function buildUserRanking(
  catalog: WorkflowCatalogEntry[],
  jobs: WorkflowJob[],
): UserRankingEntry[] {
  const workflowMap = new Map(catalog.map((workflow) => [workflow.id, workflow]));
  const baseMap = new Map<string, UserRankingEntry>(
    SYNTHETIC_USERS.map((user) => [
      user.id,
      {
        user,
        executionCount: 0,
        agentRunsEstimate: 0,
        successCount: 0,
        lastExecutionAt: null,
      },
    ]),
  );

  jobs.forEach((job) => {
    const assignmentSeed = `${job.workflowId}:${job.projectName}:${job.id}`;
    const user = SYNTHETIC_USERS[hashText(assignmentSeed) % SYNTHETIC_USERS.length];
    const current = baseMap.get(user.id);
    if (!current) return;

    const workflow = workflowMap.get(job.workflowId);
    const agentRunsEstimate = countAgentsInWorkflow(workflow);
    const lastExecutionAt = !current.lastExecutionAt || new Date(job.startedAt).getTime() > new Date(current.lastExecutionAt).getTime()
      ? job.startedAt
      : current.lastExecutionAt;

    baseMap.set(user.id, {
      ...current,
      executionCount: current.executionCount + 1,
      agentRunsEstimate: current.agentRunsEstimate + Math.max(1, agentRunsEstimate),
      successCount: current.successCount + (job.status === 'done' ? 1 : 0),
      lastExecutionAt,
    });
  });

  return [...baseMap.values()]
    .filter((entry) => entry.executionCount > 0)
    .sort((left, right) => {
      if (right.executionCount !== left.executionCount) return right.executionCount - left.executionCount;
      if (right.agentRunsEstimate !== left.agentRunsEstimate) return right.agentRunsEstimate - left.agentRunsEstimate;
      return new Date(right.lastExecutionAt ?? 0).getTime() - new Date(left.lastExecutionAt ?? 0).getTime();
    })
    .slice(0, 5);
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: agents, loading: agentsLoading, error: agentsError, reload: reloadAgents } = useAgentsList();
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [catalog, setCatalog] = useState<WorkflowCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([workflowApi.getAllJobs(), workflowApi.getCatalog()])
      .then(([jobList, catalogList]) => {
        setJobs(jobList);
        setCatalog(catalogList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const moduleCount = [...new Set(agents.map((a) => a.module))].length;
  const completedJobs = jobs.filter((j) => j.status === 'done').length;
  const runningJobs = jobs.filter((j) => j.status === 'running').length;
  const execStats = computeExecutionStats(jobs);

  const topAgents = buildAgentRanking(catalog, jobs, agents);
  const maxCount = topAgents[0]?.count ?? 1;
  const topUsers = buildUserRanking(catalog, jobs);
  const maxUserExecutions = topUsers[0]?.executionCount ?? 1;

  if (loading || agentsLoading) return <PageLoader height="100vh" />;
  if (error || agentsError) return <PageErrorState message={error || agentsError} onRetry={() => { reloadAgents(); window.location.reload(); }} />;

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
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={2}>
          <StatCard
            label="Agentes"
            value={agents.length}
            icon={<SmartToyRoundedIcon />}
            color={theme.palette.primary.main}
            subtitle={`${moduleCount} módulos`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            label="Workflows"
            value={catalog.length}
            icon={<AccountTreeRoundedIcon />}
            color="#9C27B0"
            subtitle={`${completedJobs} concluídos`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            label="Jobs Ativos"
            value={runningJobs}
            icon={<PlayArrowRoundedIcon />}
            color="#4CAF50"
            subtitle="em execução"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            label="Taxa de Sucesso"
            value={jobs.length > 0 ? `${Math.round((completedJobs / jobs.length) * 100)}%` : '—'}
            icon={<CheckCircleRoundedIcon />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            label="Execuções Hoje"
            value={execStats.todayCount}
            icon={<TodayRoundedIcon />}
            color="#FF9800"
            subtitle={`${execStats.failed} falha${execStats.failed !== 1 ? 's' : ''}`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            label="Tempo Médio"
            value={execStats.avgDuration}
            icon={<TimerRoundedIcon />}
            color="#00BCD4"
            subtitle={`${execStats.completed} execução(ões)`}
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

        {/* Ranking de usuarios + Jobs */}
        <Grid item xs={12} md={7}>
          {/* Ranking de usuarios */}
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha('#9C27B0', 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsRoundedIcon sx={{ color: '#FFB300', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Usuarios que mais executaram agentes
                  </Typography>
                </Box>
                <Chip
                  label="Visao local"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '10px',
                    fontWeight: 700,
                    bgcolor: alpha('#FFB300', 0.12),
                    color: '#FFB300',
                  }}
                />
              </Box>

              {topUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '30px', mb: 1 }}>🏆</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Ainda nao ha execucoes suficientes para compor o ranking local.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {topUsers.map((entry, idx) => {
                    const successRate = Math.round((entry.successCount / entry.executionCount) * 100);
                    return (
                      <ListItem
                        key={entry.user.id}
                        disablePadding
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          px: 1,
                          py: 0.85,
                          '&:hover': { bgcolor: alpha('#fff', 0.04) },
                        }}
                      >
                        <Box sx={{ width: 28, textAlign: 'center', flexShrink: 0, mr: 0.5 }}>
                          {idx < 3 ? (
                            <Typography sx={{ fontSize: '16px', lineHeight: 1 }}>{MEDAL[idx]}</Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                              #{idx + 1}
                            </Typography>
                          )}
                        </Box>

                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '10px',
                              bgcolor: alpha(entry.user.color, 0.18),
                              color: entry.user.color,
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {entry.user.initials}
                          </Avatar>
                        </ListItemAvatar>

                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                            <Box sx={{ minWidth: 0, mr: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {entry.user.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                                {entry.user.area}
                              </Typography>
                            </Box>
                            <Tooltip title={`${entry.executionCount} execucao(oes) derivadas localmente`}>
                              <Chip
                                label={entry.executionCount}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  ml: 1,
                                  flexShrink: 0,
                                  bgcolor: alpha(entry.user.color, 0.16),
                                  color: entry.user.color,
                                }}
                              />
                            </Tooltip>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={(entry.executionCount / maxUserExecutions) * 100}
                            sx={{
                              height: 4,
                              borderRadius: 4,
                              bgcolor: alpha('#fff', 0.05),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                bgcolor: idx === 0 ? '#FFB300' : entry.user.color,
                              },
                            }}
                          />

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, gap: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                              {entry.agentRunsEstimate} agente(s) acionado(s)
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                              {successRate}% sucesso
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}

              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', display: 'block', mt: 1.5 }}
              >
                Ranking derivado localmente a partir de {jobs.length} execucoes atuais. Ainda nao representa usuarios autenticados do backend.
              </Typography>
            </CardContent>
          </Card>

          {/* Recent Jobs — Rich Table */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Execuções Recentes
                </Typography>
                {jobs.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {jobs.length} total
                  </Typography>
                )}
              </Box>
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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Workflow / Projeto</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Progresso</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Duração</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.slice(0, 8).map((job) => {
                        const st = STATUS_MAP[job.status] ?? STATUS_MAP.pending;
                        const clickable = job.status === 'done' || job.status === 'running';
                        return (
                          <TableRow
                            key={job.id}
                            hover
                            sx={{
                              cursor: clickable ? 'pointer' : 'default',
                              '&:last-child td': { borderBottom: 0 },
                            }}
                            onClick={() => {
                              if (job.status === 'done') navigate(`/results/${job.id}`);
                              else if (job.status === 'running') navigate(`/executions/${job.id}`);
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary' }}>
                                {job.id.slice(0, 8)}…
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                                {job.projectName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                                {job.workflowId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={st.label}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  bgcolor: alpha(st.color, 0.12),
                                  color: st.color,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(job.currentStep / job.totalSteps) * 100}
                                  sx={{
                                    width: 60, height: 5, borderRadius: 3,
                                    bgcolor: alpha('#fff', 0.06),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: st.color,
                                    },
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                  {job.currentStep}/{job.totalSteps}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                {computeJobDuration(job)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                                {new Date(job.startedAt).toLocaleDateString('pt-BR')}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                                {new Date(job.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
