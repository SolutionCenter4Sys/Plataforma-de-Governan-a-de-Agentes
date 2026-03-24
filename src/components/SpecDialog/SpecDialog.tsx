import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, alpha, useTheme,
} from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { Spec } from '../../types';
import { specsApi } from '../../services/api';

interface SpecDialogProps {
  open: boolean;
  spec?: Spec | null;
  onClose: () => void;
  onSaved: () => void;
}

export const SpecDialog: React.FC<SpecDialogProps> = ({ open, spec, onClose, onSaved }) => {
  const theme = useTheme();
  const isEdit = !!spec;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (spec) {
      setName(spec.name ?? '');
      setDescription(spec.description ?? '');
      setVersion(spec.version ?? '1.0.0');
      setContent(spec.content ?? '');
    } else {
      setName(''); setDescription(''); setVersion('1.0.0'); setContent('');
    }
    setError('');
  }, [open, spec]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setLoading(true);
    setError('');
    try {
      if (isEdit && spec) {
        await specsApi.update(spec.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
          version: version.trim() || '1.0.0',
        });
      } else {
        await specsApi.create({
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
          version: version.trim() || '1.0.0',
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <DescriptionRoundedIcon sx={{ color: '#9C27B0' }} />
        {isEdit ? 'Editar Spec' : 'Nova Spec'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Nome" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Regras Jurídicas" />
          <TextField label="Versão" size="small" value={version} onChange={e => setVersion(e.target.value)} sx={{ width: 130 }} InputProps={{ sx: { fontFamily: 'monospace' } }} />
        </Box>
        <TextField label="Descrição" fullWidth size="small" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição da spec" />
        <TextField
          label="Conteúdo (Markdown)"
          fullWidth multiline rows={10} size="small"
          value={content} onChange={e => setContent(e.target.value)}
          placeholder={'# Regras\n\n- Constraint 1\n- Constraint 2'}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '13px' } }}
        />
        {error && (
          <Typography variant="body2" color="error">{error}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          sx={{ bgcolor: alpha('#9C27B0', 0.85), '&:hover': { bgcolor: '#9C27B0' } }}
        >
          {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Spec'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
