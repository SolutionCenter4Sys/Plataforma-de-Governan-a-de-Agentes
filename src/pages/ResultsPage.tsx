import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, Chip,
  Paper, Accordion, AccordionSummary, AccordionDetails, Alert,
  CircularProgress, alpha, useTheme, IconButton, Tooltip,
} from '@mui/material';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { useExecutionDetail } from '../hooks/useExecutionDetail';
import { ExecutionStep } from '../types';

function buildMarkdownFromOutput(output: Record<string, unknown>): string {
  const o = output as Record<string, any>;
  const title = o.reportTitle ?? 'Relatório — Análise';
  const summary = o.reportSummary ?? o.recommendation ?? '';
  const risk = o.risk;
  const riskClass = risk?.class ?? risk?.category ?? '';
  const riskConfidence = risk?.confidenceAdjusted ?? risk?.confidence ?? '';
  const recActions = Array.isArray(o.recommendedActions ?? o.actions) ? (o.recommendedActions ?? o.actions) : [];
  const extract = o.extract;
  const evidence = o.riskFactors?.mappedEvidence;
  const missingFields = extract?.missingFields;
  const reasoning = o?.observability?.reasoning;
  const confidence = o?.observability?.confidence;
  const alternatives = Array.isArray(o?.observability?.alternatives) ? o.observability.alternatives : [];

  const sections: string[] = [`# ${title}`];
  if (summary) sections.push(`\n## Resumo\n\n${summary}`);
  if (risk && typeof risk === 'object') sections.push(`\n## Classificação de Risco\n\n- Classe: ${riskClass || '—'}\n- Confiança ajustada: ${riskConfidence !== '' ? `${riskConfidence}%` : '—'}`);
  if (o.recommendation) sections.push(`\n## Recomendação\n\n${String(o.recommendation)}`);
  if (recActions.length) sections.push(`\n## Ações sugeridas\n\n${recActions.map((a: string) => `- ${a}`).join('\n')}`);
  if (Array.isArray(evidence) && evidence.length) sections.push(`\n## Evidências\n\n${evidence.map((e: string) => `- ${e}`).join('\n')}`);
  if (Array.isArray(missingFields) && missingFields.length) sections.push(`\n## Campos ausentes\n\n${missingFields.map((f: string) => `- ${f}`).join('\n')}`);
  if (extract && typeof extract === 'object') sections.push(`\n## Extrato\n\n\`\`\`json\n${JSON.stringify(extract, null, 2)}\n\`\`\``);
  if ((typeof reasoning === 'string' && reasoning.trim()) || confidence != null) {
    let obsSection = `\n## Raciocínio\n\n${typeof reasoning === 'string' ? reasoning : ''}`;
    obsSection += `\n\n- Confiança: ${confidence != null ? `${confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)}%` : '—'}`;
    if (alternatives.length) obsSection += `\n\n### Alternativas descartadas\n\n${alternatives.map((a: string) => `- ${a}`).join('\n')}`;
    sections.push(obsSection);
  }

  const hasContent = sections.length > 1;
  if (!hasContent) return `# ${title}\n\n## Raw Output\n\n\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``;
  return sections.join('\n');
}

export const ResultsPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: execution, loading, error, reload } = useExecutionDetail(id);
  const [outputTab, setOutputTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!id) return <Box sx={{ p: 3 }}><Typography color="text.secondary">ID de execução não informado.</Typography><Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Voltar ao Dashboard</Button></Box>;
  if (loading && !execution) return <PageLoader height="60vh" />;
  if (error && !execution) return <PageErrorState message={error || 'Erro ao carregar resultados.'} onRetry={reload} />;
  if (!execution) return <PageErrorState message="Execução não encontrada." onRetry={reload} />;

  const output = execution.output as Record<string, unknown> | null;
  const confidenceScore = output && typeof (output as any).confidence === 'number' ? (output as any).confidence : null;
  const hasError = output && ((output as any)._error || (output as any).message);
  const steps: ExecutionStep[] = execution.steps ?? [];
  const jsonOutput = output ? JSON.stringify(output, null, 2) : '';
  const markdownOutput = output ? buildMarkdownFromOutput(output) : '';

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* fallback */ }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Resultados</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {execution.id.slice(0, 8)}… — {execution.workflowName}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => window.print()} sx={{ textTransform: 'none' }}>Exportar</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: confidenceScore != null ? '1fr 2fr' : '1fr', gap: 2, mb: 3 }}>
        {confidenceScore != null && (
          <Card>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldRoundedIcon sx={{ fontSize: 28, color: '#4CAF50', mb: 1 }} />
              <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'monospace', color: '#4CAF50' }}>
                {confidenceScore <= 1 ? Math.round(confidenceScore * 100) : Math.round(confidenceScore)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Score de Confiança</Typography>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DescriptionRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>Output Final</Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Tabs value={outputTab} onChange={(_, v) => setOutputTab(v)} sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, fontSize: '12px', textTransform: 'none', fontWeight: 600 } }}>
                  <Tab label="JSON" />
                  <Tab label="Markdown" />
                </Tabs>
                <Tooltip title={copied ? 'Copiado!' : 'Copiar'}>
                  <IconButton size="small" onClick={() => copyToClipboard(outputTab === 0 ? jsonOutput : markdownOutput)}>
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {outputTab === 0 ? (
                <Box sx={{ maxHeight: 320, overflow: 'auto', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {output ? jsonOutput : '—'}
                </Box>
              ) : (
                <Box sx={{ maxHeight: 320, overflow: 'auto', '& h1': { fontSize: '16px' }, '& h2': { fontSize: '14px', mt: 2 }, '& h3': { fontSize: '13px', mt: 1.5 }, '& p': { fontSize: '13px' }, '& li': { fontSize: '13px' }, '& pre': { bgcolor: alpha('#000', 0.3), p: 2, borderRadius: 1, overflow: 'auto', fontSize: '11px' }, '& code': { fontFamily: 'monospace', fontSize: '11px' } }}>
                  {output ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownOutput}</ReactMarkdown> : <Typography variant="body2" color="text.secondary">—</Typography>}
                </Box>
              )}
            </Paper>
          </CardContent>
        </Card>
      </Box>

      {hasError && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningAmberRoundedIcon />}>
          {String((output as any)._error ?? (output as any).message)}
        </Alert>
      )}

      {/* Traceability */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Rastreabilidade — Passo a Passo</Typography>
          {steps.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Nenhum passo registrado.</Typography>
          ) : (
            steps.map((step, i) => {
              const stepType = step.type ?? 'llm';
              const isFailed = step.status === 'failed';
              const durLabel = step.durationMs != null ? (step.durationMs >= 1000 ? `${(step.durationMs / 1000).toFixed(1)}s` : `${step.durationMs}ms`) : '';

              return (
                <Accordion key={step.id} variant="outlined" sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 } }}>
                    {isFailed ? <ErrorRoundedIcon sx={{ color: 'error.main', fontSize: 18 }} /> : <CheckCircleRoundedIcon sx={{ color: '#4CAF50', fontSize: 18 }} />}
                    <Typography variant="body2" fontWeight={600}>Passo {i + 1}</Typography>
                    <Chip label={stepType} size="small" sx={{ fontSize: '10px', fontFamily: 'monospace', height: 20, bgcolor: stepType === 'parallel' ? alpha(theme.palette.primary.main, 0.1) : alpha('#fff', 0.05) }} />
                    <Box sx={{ flex: 1 }} />
                    {durLabel && <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{durLabel}</Typography>}
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>Input</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 0.5, fontFamily: 'monospace', fontSize: '11px', maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#9C27B0' }}>
                          {step.input != null ? JSON.stringify(step.input, null, 2) : '—'}
                        </Paper>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 600 }}>Output</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 0.5, fontFamily: 'monospace', fontSize: '11px', maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: theme.palette.primary.main }}>
                          {step.output != null ? JSON.stringify(step.output, null, 2) : '—'}
                        </Paper>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
