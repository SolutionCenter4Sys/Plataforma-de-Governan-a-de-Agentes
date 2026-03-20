import React from 'react';
import {
  Card, CardContent, CardActions, Box, Typography,
  Chip, Button, alpha, useTheme,
} from '@mui/material';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import { Agent, MODULE_LABELS, MODULE_COLORS } from '../../types';

interface AgentCardProps {
  agent: Agent;
  onChat: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onChat }) => {
  const theme = useTheme();
  const moduleColor = MODULE_COLORS[agent.module] || theme.palette.primary.main;
  const moduleLabel = MODULE_LABELS[agent.module] || agent.module;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
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
        {/* Header */}
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
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {agent.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.25 }}
            >
              {agent.title}
            </Typography>
          </Box>
        </Box>

        {/* Module Chip */}
        <Chip
          label={moduleLabel}
          size="small"
          sx={{
            mb: 1.5, height: 20, fontSize: '10px', fontWeight: 700,
            bgcolor: alpha(moduleColor, 0.12),
            color: moduleColor,
            border: `1px solid ${alpha(moduleColor, 0.25)}`,
          }}
        />

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {agent.role || agent.description}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ChatRoundedIcon />}
          onClick={() => onChat(agent)}
          fullWidth
          sx={{
            borderColor: alpha(moduleColor, 0.3),
            color: moduleColor,
            '&:hover': {
              borderColor: moduleColor,
              bgcolor: alpha(moduleColor, 0.08),
            },
          }}
        >
          Conversar
        </Button>
      </CardActions>
    </Card>
  );
};
