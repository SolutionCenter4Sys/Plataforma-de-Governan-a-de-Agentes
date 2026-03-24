import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

interface PageErrorStateProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const PageErrorState: React.FC<PageErrorStateProps> = ({ message, onRetry, compact = false }) => (
  <Box sx={{ p: compact ? 0 : 3 }}>
    <Alert severity="error">{message}</Alert>
    {onRetry && (
      <Button onClick={onRetry} sx={{ mt: 2 }}>
        Tentar novamente
      </Button>
    )}
    {!onRetry && compact && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Atualize a tela ou tente novamente mais tarde.
      </Typography>
    )}
  </Box>
);
