import React, { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, CircularProgress,
  Paper, Chip, alpha, useTheme, Tooltip,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Agent, ChatMessage, LLMMode } from '../../types';
import { chatApi } from '../../services/api';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ChatInterfaceProps {
  agent: Agent;
  mode: LLMMode;
  provider: string;
  model: string;
  apiKey?: string;
}

const ModeColors: Record<LLMMode, string> = {
  agent: '#4CAF50',
  plan: '#2196F3',
  ask: '#9C27B0',
  bug: '#F44336',
};

const ModeLabels: Record<LLMMode, string> = {
  agent: '⚙️ Agent',
  plan: '📋 Plan',
  ask: '💬 Ask',
  bug: '🐛 Bug',
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agent, mode, provider, model, apiKey,
}) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensagem de boas-vindas do agente
  useEffect(() => {
    const welcome: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `**${agent.name} - ${agent.title}** aqui! ${agent.icon}\n\nOlá Rodrigo! Estou no modo **${ModeLabels[mode]}**. Como posso ajudar com o seu projeto?\n\n> 💡 Dica: Use os modos para diferentes objetivos — *Agent* executa autonomamente, *Plan* só planeja, *Ask* responde diretamente, *Bug* analisa problemas.`,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [agent, mode]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.send({
        agentId: agent.id,
        message: userMsg.content,
        history: messages,
        mode,
        provider: provider as 'mock' | 'anthropic' | 'openai',
        model,
        apiKey,
      });
      setMessages(prev => [...prev, response]);
    } catch {
      const errMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '❌ Erro ao processar resposta. Verifique se o backend está rodando em `localhost:3001`.',
        agentId: agent.id,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2, display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '10px', fontSize: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {agent.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {agent.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {agent.title}
          </Typography>
        </Box>
        <Chip
          label={ModeLabels[mode]}
          size="small"
          sx={{
            fontWeight: 700, fontSize: '11px',
            bgcolor: alpha(ModeColors[mode], 0.12),
            color: ModeColors[mode],
            border: `1px solid ${alpha(ModeColors[mode], 0.3)}`,
          }}
        />
        <Chip
          label={provider === 'mock' ? '🟡 Mock' : `${model}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: '11px', fontWeight: 600 }}
        />
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1, overflowY: 'auto', p: 2,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}
      >
        {messages.map(msg => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', mr: 1, mt: 0.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                {agent.icon}
              </Box>
            )}
            <Paper
              elevation={0}
              sx={{
                maxWidth: '78%',
                p: 2,
                bgcolor: msg.role === 'user'
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha('#fff', 0.04),
                border: `1px solid ${msg.role === 'user'
                  ? alpha(theme.palette.primary.main, 0.3)
                  : alpha('#fff', 0.06)}`,
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                '& p': { m: 0, mb: '0.5em', '&:last-child': { mb: 0 } },
                '& pre': {
                  bgcolor: alpha('#000', 0.3), p: 1.5, borderRadius: 1,
                  overflow: 'auto', fontSize: '13px',
                },
                '& code': { fontFamily: 'monospace', fontSize: '13px' },
                '& table': { borderCollapse: 'collapse', width: '100%' },
                '& th, & td': {
                  border: `1px solid ${alpha('#fff', 0.1)}`,
                  p: '6px 10px', fontSize: '13px',
                },
                '& th': { bgcolor: alpha('#fff', 0.05), fontWeight: 700 },
                '& blockquote': {
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  ml: 0, pl: 1.5, color: 'text.secondary',
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
              {msg.tokens && (
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
                  ↑ {msg.tokens.input} · ↓ {msg.tokens.output} tokens
                </Typography>
              )}
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32, height: 32, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              {agent.icon}
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: alpha('#fff', 0.04),
                border: `1px solid ${alpha('#fff', 0.06)}`,
                borderRadius: '4px 16px 16px 16px',
                display: 'flex', alignItems: 'center', gap: 1,
              }}
            >
              <CircularProgress size={14} color="primary" />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {agent.name} está pensando...
              </Typography>
            </Paper>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2, borderTop: `1px solid ${alpha('#fff', 0.06)}`,
          display: 'flex', gap: 1, alignItems: 'flex-end',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={`Mensagem para ${agent.name}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <Tooltip title="Enviar (Enter)">
          <span>
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading}
              color="primary"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.25) },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <SendRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};
