import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  Switch, FormControlLabel, Button, Chip, Alert,
  Divider, alpha, useTheme,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { configApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const [health, setHealth] = useState<{ status: string; mockMode: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    configApi.health()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        ⚙️ Configurações
      </Typography>

      {/* Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Status da Plataforma
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircleRoundedIcon />}
              label={health ? `Backend: ${health.status}` : 'Backend: Verificando...'}
              sx={{
                bgcolor: alpha(health?.status === 'ok' ? '#4CAF50' : '#F44336', 0.1),
                color: health?.status === 'ok' ? '#4CAF50' : '#F44336',
                fontWeight: 700,
              }}
            />
            <Chip
              label={health?.mockMode ? '🟡 Modo Mock Ativo' : '🟢 LLMs Ativos'}
              sx={{
                bgcolor: alpha(health?.mockMode ? '#FFC107' : '#4CAF50', 0.1),
                color: health?.mockMode ? '#FFC107' : '#4CAF50',
                fontWeight: 700,
              }}
            />
          </Box>

          {health?.mockMode && (
            <Alert severity="info" sx={{ mt: 2 }}>
              O backend está rodando em <strong>Modo Mock</strong>. As respostas são simuladas.
              Para usar LLMs reais, adicione as chaves de API abaixo e configure <code>MOCK_MODE=false</code> no arquivo <code>backend-node/.env</code>.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            🔑 Chaves de API LLM
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            As chaves são enviadas com cada requisição. Para persistência, configure no arquivo <code>.env</code>.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Anthropic API Key"
              type="password"
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              size="small"
              helperText="Para usar Claude (opus-4-5, sonnet-4-5, haiku-3-5)"
            />
            <TextField
              label="OpenAI API Key"
              type="password"
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              size="small"
              helperText="Para usar GPT-4o, GPT-4-turbo"
            />
          </Box>

          {saved && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Chaves salvas para a sessão atual!
            </Alert>
          )}

          <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }}>
            Salvar na Sessão
          </Button>
        </CardContent>
      </Card>

      {/* BMAD Config */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            📁 Configuração BMAD
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Caminhos configurados no arquivo <code>backend-node/.env</code>
          </Typography>

          <Box sx={{ bgcolor: alpha('#000', 0.3), p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: '13px' }}>
            <Box sx={{ color: '#4CAF50' }}>BMAD_ROOT=C:/Cursor_Codigo/Simulacao BMAD/BMAD V11/_bmad</Box>
            <Box sx={{ color: '#4CAF50' }}>WORKFLOW_ROOT=C:/Cursor_Codigo/Simulacao BMAD/Workflow_Producao-MVP</Box>
            <Box sx={{ color: '#FFC107' }}>MOCK_MODE=true  # Mude para false para usar LLMs reais</Box>
            <Box sx={{ color: '#9E9E9E' }}>PORT=3001</Box>
          </Box>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            ℹ️ Sobre a Plataforma
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              ['Versão', '1.0.0'],
              ['BMAD Method', 'v6.0.0-alpha.23'],
              ['Frontend', 'React 18 + Vite + Material-UI v5'],
              ['Backend', 'Node.js + Express + TypeScript'],
              ['Agentes', '27 agentes BMAD em 6 módulos'],
              ['Workflows', 'Produção MVP (5 steps)'],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{k}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Plataforma de Agentes AI — Foursys Innovation Labs · 2026
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
