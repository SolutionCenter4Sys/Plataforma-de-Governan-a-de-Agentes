import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title = 'Confirmar remoção', message,
  confirmLabel = 'Remover', cancelLabel = 'Cancelar',
  loading = false, onConfirm, onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? 'Removendo...' : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
