import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  ToggleButtonGroup, ToggleButton, Select, MenuItem,
  FormControl, InputLabel, TextField,
  Divider, alpha, useTheme, Autocomplete, Chip,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { ChatInterface } from '../components/ChatInterface/ChatInterface';
import { PageErrorState } from '../components/Feedback/PageErrorState';
import { PageLoader } from '../components/Feedback/PageLoader';
import { useAgentsList } from '../hooks/useAgentsList';
import { Agent, LLMMode } from '../types';

const MODE_OPTIONS: { value: LLMMode; label: string; desc: string }[] = [
  { value: 'agent', label: '⚙️ Agent', desc: 'Executa autonomamente' },
  { value: 'plan', label: '📋 Plan', desc: 'Apenas planeja' },
  { value: 'ask', label: '💬 Ask', desc: 'Resposta direta' },
  { value: 'bug', label: '🐛 Bug', desc: 'Analisa problemas' },
];

export const ChatPage: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { data: agents, loading, error, reload } = useAgentsList();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [mode, setMode] = useState<LLMMode>('ask');
  const [provider, setProvider] = useState('mock');
  const [model, setModel] = useState('mock');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const agentParam = searchParams.get('agent');
    if (!agentParam) return;
    const found = agents.find(a => a.id === agentParam);
    if (found) setSelectedAgent(found);
  }, [agents, searchParams]);

  if (loading) return <PageLoader />;
  if (error) return <PageErrorState message={error} onRetry={reload} />;

  return (
    <Box sx={{ height: { md: '100vh' }, display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.25 }}>Chat com Agentes</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Selecione um agente, modo e LLM — os detalhes BMAD ficam ocultos do usuário
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 2.5, pt: 2, gap: 2.5 }}>
        {/* Config Panel */}
        <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Agent Select */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                🤖 Agente
              </Typography>
              <Autocomplete
                options={agents}
                getOptionLabel={a => `${a.icon} ${a.name} — ${a.title}`}
                value={selectedAgent}
                onChange={(_, v) => setSelectedAgent(v)}
                size="small"
                renderInput={params => (
                  <TextField {...params} label="Selecionar agente" />
                )}
                renderOption={(props, a) => (
                  <Box component="li" {...props} sx={{ gap: 1 }}>
                    <span>{a.icon}</span>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{a.title}</Typography>
                    </Box>
                  </Box>
                )}
              />
            </CardContent>
          </Card>

          {/* Mode Select */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                🎛️ Modo
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => v && setMode(v)}
                orientation="vertical"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    justifyContent: 'flex-start', px: 1.5, py: 0.75,
                    border: `1px solid ${alpha('#fff', 0.08)} !important`,
                    borderRadius: '8px !important',
                    mb: 0.5, fontWeight: 600, fontSize: '13px',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      color: theme.palette.primary.main,
                      borderColor: `${alpha(theme.palette.primary.main, 0.3)} !important`,
                    },
                  },
                }}
              >
                {MODE_OPTIONS.map(opt => (
                  <ToggleButton key={opt.value} value={opt.value}>
                    <Box sx={{ textAlign: 'left' }}>
                      <span>{opt.label}</span>
                      <Typography component="span" variant="caption" sx={{ color: 'inherit', opacity: 0.7, ml: 1 }}>
                        {opt.desc}
                      </Typography>
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </CardContent>
          </Card>

          {/* LLM Config */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                🧠 LLM
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Provedor</InputLabel>
                  <Select
                    value={provider}
                    label="Provedor"
                    onChange={e => {
                      setProvider(e.target.value);
                      setModel(e.target.value === 'mock' ? 'mock' : 'claude-opus-4-5');
                    }}
                  >
                    <MenuItem value="mock">🟡 Mock</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="openai">OpenAI</MenuItem>
                  </Select>
                </FormControl>

                {provider !== 'mock' && (
                  <>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Modelo</InputLabel>
                      <Select value={model} label="Modelo" onChange={e => setModel(e.target.value)}>
                        {provider === 'anthropic'
                          ? ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'].map(m => (
                              <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))
                          : ['gpt-4o', 'gpt-4o-mini'].map(m => (
                              <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="API Key"
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      fullWidth
                    />
                  </>
                )}

                {provider === 'mock' && (
                  <Chip
                    label="Modo Mock ativo — respostas simuladas"
                    size="small"
                    sx={{
                      bgcolor: alpha('#FFC107', 0.1), color: '#FFC107',
                      border: `1px solid ${alpha('#FFC107', 0.3)}`,
                      fontSize: '11px', fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {selectedAgent ? (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ChatInterface
                agent={selectedAgent}
                mode={mode}
                provider={provider}
                model={model}
                apiKey={apiKey || undefined}
              />
            </Card>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography sx={{ fontSize: '64px', mb: 2 }}>🤖</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Selecione um Agente
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, maxWidth: 400 }}>
                  Escolha um agente BMAD no painel lateral. Cada agente tem expertise específica e personalidade única.
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Sugestões rápidas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {agents.slice(0, 6).map(a => (
                    <Chip
                      key={a.id}
                      label={`${a.icon} ${a.name}`}
                      clickable
                      onClick={() => setSelectedAgent(a)}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Box>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};
