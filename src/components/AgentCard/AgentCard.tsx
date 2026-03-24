import React from 'react';
import {
  Card, CardContent, CardActions, Box, Typography,
  Chip, Button, IconButton, Tooltip, alpha, useTheme,
} from '@mui/material';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import InputRoundedIcon from '@mui/icons-material/InputRounded';
import OutputRoundedIcon from '@mui/icons-material/OutputRounded';
import { Agent, MODULE_LABELS, MODULE_COLORS } from '../../types';

interface AgentCardProps {
  agent: Agent;
  onChat: (agent: Agent) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onChat, onEdit, onDelete }) => {
  const theme = useTheme();
  const moduleColor = MODULE_COLORS[agent.module] || theme.palette.primary.main;
  const moduleLabel = MODULE_LABELS[agent.module] || agent.module;
  const extAgent = agent as Agent & { inputFields?: unknown[]; outputBlocks?: unknown[] };
  const inputCount = extAgent.inputFields?.length ?? 0;
  const outputCount = extAgent.outputBlocks?.length ?? 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
        '&:hover .agent-card-actions': { opacity: 1 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          borderRadius: '12px 12px 0 0',
          background: `linear-gradient(90deg, ${moduleColor} 0%, ${alpha(moduleColor, 0.4)} 100%)`,
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
              background: alpha(moduleColor, 0.12),
              border: `1px solid ${alpha(moduleColor, 0.2)}`,
            }}
          >
            {agent.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {agent.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.25 }}>
              {agent.title}
            </Typography>
          </Box>
          {(onEdit || onDelete) && (
            <Box className="agent-card-actions" sx={{ display: 'flex', gap: 0.3, opacity: 0, transition: 'opacity 0.2s' }}>
              {onEdit && (
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={e => { e.stopPropagation(); onEdit(agent); }}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Remover">
                  <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); onDelete(agent); }}><DeleteRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          <Chip
            label={moduleLabel}
            size="small"
            sx={{
              height: 20, fontSize: '10px', fontWeight: 700,
              bgcolor: alpha(moduleColor, 0.12),
              color: moduleColor,
              border: `1px solid ${alpha(moduleColor, 0.25)}`,
            }}
          />
          {inputCount > 0 && (
            <Tooltip title={`${inputCount} campo${inputCount !== 1 ? 's' : ''} de entrada`}>
              <Chip
                icon={<InputRoundedIcon sx={{ fontSize: '12px !important' }} />}
                label={inputCount}
                size="small"
                sx={{
                  height: 20, fontSize: '10px', fontWeight: 700,
                  bgcolor: alpha('#2196F3', 0.1),
                  color: '#2196F3',
                  '& .MuiChip-icon': { color: '#2196F3' },
                }}
              />
            </Tooltip>
          )}
          {outputCount > 0 && (
            <Tooltip title={`${outputCount} bloco${outputCount !== 1 ? 's' : ''} de saída`}>
              <Chip
                icon={<OutputRoundedIcon sx={{ fontSize: '12px !important' }} />}
                label={outputCount}
                size="small"
                sx={{
                  height: 20, fontSize: '10px', fontWeight: 700,
                  bgcolor: alpha('#4CAF50', 0.1),
                  color: '#4CAF50',
                  '& .MuiChip-icon': { color: '#4CAF50' },
                }}
              />
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {agent.role || agent.description}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined" size="small" startIcon={<ChatRoundedIcon />}
          onClick={() => onChat(agent)} fullWidth
          sx={{ borderColor: alpha(moduleColor, 0.3), color: moduleColor, '&:hover': { borderColor: moduleColor, bgcolor: alpha(moduleColor, 0.08) } }}
        >
          Conversar
        </Button>
      </CardActions>
    </Card>
  );
};
