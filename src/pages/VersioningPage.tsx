import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Typography, Card, CardContent, Button, Chip, Paper,
  ToggleButtonGroup, ToggleButton, IconButton, Grid, alpha, useTheme, Tooltip,
} from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { versionsApi } from '../services/api';
import { VersionComparison, VersionEntry } from '../types';

const ENTITY_CONFIG = {
  spec: { icon: <DescriptionRoundedIcon sx={{ fontSize: 18 }} />, color: '#9C27B0', label: 'Spec' },
  agent: { icon: <SmartToyRoundedIcon sx={{ fontSize: 18 }} />, color: '#FF5315', label: 'Agente' },
  workflow: { icon: <AccountTreeRoundedIcon sx={{ fontSize: 18 }} />, color: '#4CAF50', label: 'Workflow' },
};

const STATUS_CONFIG = {
  active: { color: '#4CAF50', label: 'Ativo' },
  locked: { color: '#FFC107', label: 'Travado' },
  deprecated: { color: '#9E9E9E', label: 'Deprecado' },
};

export const VersioningPage: React.FC = () => {
  const theme = useTheme();
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [comparing, setComparing] = useState<VersionComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await versionsApi.list({ entity: filterEntity as VersionEntry['entity'] | 'all' });
      setVersions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar versões.');
    } finally {
      setLoading(false);
    }
  }, [filterEntity]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const grouped = useMemo(() => {
    return versions
      .filter((entry) => filterEntity === 'all' || entry.entity === filterEntity)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .reduce<Record<string, VersionEntry[]>>((acc, entry) => {
        const key = `${entry.entity}-${entry.entityId}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      }, {});
  }, [filterEntity, versions]);

  const lockVersion = async (id: string) => {
    setActionLoadingId(id);
    try {
      await versionsApi.lock(id);
      await loadVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao travar versão.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const rollbackVersion = async (id: string) => {
    setActionLoadingId(id);
    try {
      await versionsApi.rollback(id);
      await loadVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao executar rollback.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const compareVersions = async (leftId: string, rightId: string) => {
    setActionLoadingId(leftId);
    try {
      setComparing(await versionsApi.compare(leftId, rightId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao comparar versões.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <PageLoader height="60vh" />;
  if (error && versions.length === 0) return <PageErrorState message={error} onRetry={loadVersions} />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Versionamento</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Histórico, travamento e rollback de versões</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <ToggleButtonGroup
        value={filterEntity}
        exclusive
        onChange={(_, value) => value && setFilterEntity(value)}
        size="small"
        sx={{ mb: 3, '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, fontSize: '12px' } }}
      >
        <ToggleButton value="all">Todos</ToggleButton>
        <ToggleButton value="spec">Specs</ToggleButton>
        <ToggleButton value="agent">Agentes</ToggleButton>
        <ToggleButton value="workflow">Workflows</ToggleButton>
      </ToggleButtonGroup>

      {comparing && (
        <Card sx={{ mb: 3, border: `2px solid ${alpha('#9C27B0', 0.3)}` }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareArrowsRoundedIcon sx={{ color: '#9C27B0' }} />
                <Typography variant="subtitle2" fontWeight={700}>Comparação de Versões</Typography>
              </Box>
              <IconButton size="small" onClick={() => setComparing(null)}><CloseRoundedIcon fontSize="small" /></IconButton>
            </Box>
            {comparing.summary.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {comparing.summary.map((item) => (
                  <Typography key={item} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    • {item}
                  </Typography>
                ))}
              </Box>
            )}
            <Grid container spacing={2}>
              {[comparing.left, comparing.right].map((entry) => (
                <Grid item xs={6} key={entry.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocalOfferRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>v{entry.version}</Typography>
                      <Chip label={STATUS_CONFIG[entry.status].label} size="small" sx={{ bgcolor: alpha(STATUS_CONFIG[entry.status].color, 0.1), color: STATUS_CONFIG[entry.status].color, fontSize: '10px', height: 20 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{entry.createdAt}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>Alterações</Typography>
                    {entry.changes.map((change, changeIndex) => (
                      <Box key={`${entry.id}-${changeIndex}`} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5 }}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.primary.main, mt: 0.8, flexShrink: 0 }} />
                        <Typography variant="caption">{change}</Typography>
                      </Box>
                    ))}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: 'monospace' }}>{entry.executionCount} execuções</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {Object.keys(grouped).length === 0 && (
        <Alert severity="info">Nenhuma versão encontrada para os filtros aplicados.</Alert>
      )}

      {Object.entries(grouped).map(([key, groupVersions]) => {
        const first = groupVersions[0];
        const entityConfig = ENTITY_CONFIG[first.entity];

        return (
          <Box key={key} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ color: entityConfig.color }}>{entityConfig.icon}</Box>
              <Typography variant="subtitle1" fontWeight={700}>{first.entityName}</Typography>
              <Chip label={entityConfig.label} size="small" sx={{ bgcolor: alpha(entityConfig.color, 0.1), color: entityConfig.color, fontSize: '10px', fontFamily: 'monospace', height: 20 }} />
            </Box>

            <Box sx={{ borderLeft: `2px solid ${alpha('#fff', 0.08)}`, ml: 1, pl: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {groupVersions.map((entry, index) => {
                const statusConfig = STATUS_CONFIG[entry.status];
                return (
                  <Card key={entry.id} sx={{ '&:hover .version-actions': { opacity: 1 } }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <LocalOfferRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace' }}>v{entry.version}</Typography>
                            <Chip label={statusConfig.label} size="small" sx={{ bgcolor: alpha(statusConfig.color, 0.1), color: statusConfig.color, fontSize: '10px', fontFamily: 'monospace', height: 20 }} />
                            {entry.status === 'locked' && <LockRoundedIcon sx={{ fontSize: 14, color: '#FFC107' }} />}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace' }}>
                              <AccessTimeRoundedIcon sx={{ fontSize: 12 }} />{entry.createdAt}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{entry.executionCount} execuções</Typography>
                            {entry.lockedAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace' }}>
                                <LockRoundedIcon sx={{ fontSize: 12 }} />Travado: {entry.lockedAt}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {entry.changes.map((change, changeIndex) => (
                              <Chip key={`${entry.id}-change-${changeIndex}`} label={change} size="small" sx={{ fontSize: '10px', height: 22, bgcolor: alpha('#fff', 0.05) }} />
                            ))}
                          </Box>
                        </Box>

                        <Box className="version-actions" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                          {entry.status === 'active' && (
                            <Tooltip title="Travar versão">
                              <Button size="small" startIcon={<LockRoundedIcon />} disabled={actionLoadingId === entry.id} onClick={() => lockVersion(entry.id)} sx={{ color: '#FFC107', fontSize: '11px' }}>Travar</Button>
                            </Tooltip>
                          )}
                          {entry.status === 'locked' && (
                            <Tooltip title="Rollback">
                              <Button size="small" startIcon={<RestoreRoundedIcon />} disabled={actionLoadingId === entry.id} onClick={() => rollbackVersion(entry.id)} sx={{ color: theme.palette.primary.main, fontSize: '11px' }}>Rollback</Button>
                            </Tooltip>
                          )}
                          {index < groupVersions.length - 1 && (
                            <Tooltip title="Comparar com versão anterior">
                              <Button size="small" startIcon={<CompareArrowsRoundedIcon />} disabled={actionLoadingId === entry.id} onClick={() => compareVersions(entry.id, groupVersions[index + 1].id)} sx={{ color: '#9C27B0', fontSize: '11px' }}>Comparar</Button>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
