import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box,
  Typography, Tabs, Tab, Select, MenuItem, FormControl, InputLabel,
  IconButton, Checkbox, alpha, useTheme, Paper, Chip, Tooltip,
} from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import {
  Spec, ManagedAgent, InputField, OutputBlock, MethodRule, AgentExecutionStep,
} from '../../types';
import { managedAgentsApi } from '../../services/api';

const DEFAULT_OUTPUT_BLOCKS: OutputBlock[] = [
  { id: '1', name: 'Nome do Agente e Contexto', description: 'Identificação do agente, data, versão e contexto de execução', deliveryFormat: 'JSON', qualityCriteria: 'Deve conter: nome, versão, timestamp, contexto', enabled: true },
  { id: '2', name: 'Sumário Executivo', description: 'Visão geral sintética. Compreensível por C-level em menos de 2 minutos', deliveryFormat: 'Texto', qualityCriteria: 'Claro, conciso, sem jargão técnico', enabled: true },
  { id: '3', name: 'Diagnóstico / Análise Principal', description: 'Corpo central. Análise detalhada com mapeamento do problema', deliveryFormat: 'Documento estruturado', qualityCriteria: 'Profundidade técnica adequada', enabled: true },
  { id: '4', name: 'Recomendações / Plano de Ação', description: 'Próximos passos concretos e acionáveis', deliveryFormat: 'Tabela ou lista priorizada', qualityCriteria: 'Cada item deve ser acionável', enabled: true },
  { id: '5', name: 'Entregáveis Complementares', description: 'Artefatos adicionais: diagramas, planilhas, minutas', deliveryFormat: 'Lista de artefatos', qualityCriteria: 'Cada entregável deve ter nome, formato e localização', enabled: false },
  { id: '6', name: 'Métricas de Impacto', description: 'Indicadores quantitativos e qualitativos', deliveryFormat: 'Tabela comparativa ou KPIs', qualityCriteria: 'Pelo menos 1 métrica quantitativa', enabled: false },
  { id: '7', name: 'Disclaimers e Limitações', description: 'Premissas, dados ausentes, áreas que precisam validação', deliveryFormat: 'Lista de ressalvas', qualityCriteria: 'Honesto e transparente', enabled: true },
  { id: '8', name: 'Próximos Comandos Sugeridos', description: 'Indicação de funcionalidades a seguir', deliveryFormat: 'Lista de opções com contexto', qualityCriteria: 'Cada sugestão deve explicar o que irá gerar', enabled: false },
];

const DEFAULT_METHOD_RULES: MethodRule[] = [
  { scenario: 'Todos os dados obrigatórios fornecidos', agentBehavior: 'Prosseguir diretamente para o método de processamento. Confirmar entendimento antes.', maxAttempts: null, fallback: null },
  { scenario: 'Dados obrigatórios parcialmente ausentes', agentBehavior: 'BLOCK: Iniciar sequência de perguntas direcionadas para coletar os dados.', actionIfMandatoryAbsent: 'PERGUNTAR de forma clara e específica.', actionIfOptionalAbsent: 'NÃO perguntar sobre desejáveis enquanto obrigatórios estiverem pendentes', maxAttempts: 3, fallback: 'Após 3 tentativas, registrar como PREMISSA ASSUMIDA com alerta' },
  { scenario: 'Nenhum dado obrigatório fornecido', agentBehavior: 'Iniciar modo ENTREVISTA. Fazer perguntas estruturadas na ordem de prioridade.', actionIfMandatoryAbsent: 'MODO ENTREVISTA: seguir a ordem dos inputs.', actionIfOptionalAbsent: 'Ignorar desejáveis até que os obrigatórios estejam completos', maxAttempts: 3, fallback: 'Registrar todas as ausências como premissas assumidas' },
  { scenario: 'Dados conflitantes ou inconsistentes', agentBehavior: 'PAUSAR e apresentar a inconsistência ao usuário de forma clara.', actionIfMandatoryAbsent: 'Apresentar: Percebi uma inconsistência entre X e Y.', maxAttempts: 2, fallback: 'Usar o dado mais conservador/seguro e registrar no output' },
  { scenario: 'Input com formato inválido ou incompreensível', agentBehavior: 'REFORMULAR a pergunta de forma diferente. Dar exemplos concretos.', actionIfMandatoryAbsent: 'Reformular + dar exemplo.', maxAttempts: 3, fallback: 'Pedir que o usuário informe de forma simples' },
];

const STEP_TYPES = [
  { id: 'parsing', label: 'Parsing' },
  { id: 'analysis', label: 'Análise' },
  { id: 'transformation', label: 'Transformação' },
  { id: 'validation', label: 'Validação' },
  { id: 'enrichment', label: 'Enriquecimento' },
  { id: 'output', label: 'Output' },
];

const DELIVERY_FORMATS = ['Texto', 'JSON', 'Tabela', 'Lista', 'Markdown', 'Documento estruturado', 'KPIs'];

interface AgentDialogProps {
  open: boolean;
  agent?: ManagedAgent | null;
  specs: Spec[];
  onClose: () => void;
  onSaved: () => void;
}

export const AgentDialog: React.FC<AgentDialogProps> = ({ open, agent, specs, onClose, onSaved }) => {
  const theme = useTheme();
  const isEdit = !!agent;
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [promptTemplate, setPromptTemplate] = useState(
    'Retorne APENAS JSON válido no formato:\n{\n  "data": {},\n  "observability": { "reasoning": "...", "confidence": 0.9, "alternatives": [] }\n}\n\nDados: {{text}}'
  );
  const [contextSourcesJson, setContextSourcesJson] = useState('[{ "type": "specs", "enabled": true, "config": {} }]');
  const [executionSteps, setExecutionSteps] = useState<AgentExecutionStep[]>([
    { name: 'analise', type: 'analysis', description: '', promptTemplateOverride: '' },
  ]);
  const [expandedStepIdx, setExpandedStepIdx] = useState<number | null>(null);

  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [outputBlocks, setOutputBlocks] = useState<OutputBlock[]>(DEFAULT_OUTPUT_BLOCKS);
  const [methodRules, setMethodRules] = useState<MethodRule[]>(DEFAULT_METHOD_RULES);

  useEffect(() => {
    if (!open) return;
    setTab(0);
    setError('');
    if (agent) {
      setName(agent.name ?? '');
      setDescription(agent.description ?? '');
      setSelectedSpec(agent.specId ?? '');
      setPromptTemplate(agent.promptTemplate ?? '');
      setContextSourcesJson(agent.contextSources ? JSON.stringify(agent.contextSources, null, 2) : '[]');
      setExecutionSteps(Array.isArray(agent.executionSteps) ? (agent.executionSteps as AgentExecutionStep[]) : [{ name: 'analise', type: 'analysis' }]);
      setInputFields(agent.inputFields ?? []);
      setOutputBlocks(agent.outputBlocks ?? DEFAULT_OUTPUT_BLOCKS);
      setMethodRules(agent.methodRules ?? DEFAULT_METHOD_RULES);
    } else {
      setName(''); setDescription(''); setSelectedSpec('');
      setPromptTemplate('Retorne APENAS JSON válido no formato:\n{\n  "data": {},\n  "observability": { "reasoning": "...", "confidence": 0.9, "alternatives": [] }\n}\n\nDados: {{text}}');
      setContextSourcesJson('[{ "type": "specs", "enabled": true, "config": {} }]');
      setExecutionSteps([{ name: 'analise', type: 'analysis' }]);
      setExpandedStepIdx(null);
      setInputFields([]);
      setOutputBlocks(DEFAULT_OUTPUT_BLOCKS);
      setMethodRules(DEFAULT_METHOD_RULES);
    }
  }, [open, agent]);

  const addStep = () => setExecutionSteps(p => [...p, { name: `step_${p.length + 1}`, type: 'analysis' }]);
  const removeStep = (i: number) => setExecutionSteps(p => p.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof AgentExecutionStep, v: string) =>
    setExecutionSteps(p => { const n = [...p]; n[i] = { ...n[i], [field]: v }; return n; });
  const moveStep = (i: number, dir: -1 | 1) =>
    setExecutionSteps(p => { const n = [...p]; const t = i + dir; if (t < 0 || t >= n.length) return p; [n[i], n[t]] = [n[t], n[i]]; return n; });

  const addInputField = () => setInputFields(p => [...p, { name: '', classification: 'OBRIGATORIO', dataType: 'Texto', behaviorIfAbsent: 'BLOCK', options: [] }]);
  const removeInputField = (i: number) => setInputFields(p => p.filter((_, idx) => idx !== i));
  const updateInputField = (i: number, field: keyof InputField, v: string | string[]) =>
    setInputFields(p => { const n = [...p]; n[i] = { ...n[i], [field]: v } as InputField; return n; });

  const toggleOutputBlock = (id: string) => setOutputBlocks(p => p.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  const updateOutputBlock = (id: string, field: keyof OutputBlock, v: string) =>
    setOutputBlocks(p => p.map(b => b.id === id ? { ...b, [field]: v } : b));

  const updateMethodRule = (i: number, field: keyof MethodRule, v: string | number | null) =>
    setMethodRules(p => { const n = [...p]; n[i] = { ...n[i], [field]: v } as MethodRule; return n; });

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    if (!selectedSpec) { setError('Selecione uma Spec'); return; }
    for (let i = 0; i < inputFields.length; i++) {
      if (!inputFields[i].name.trim()) { setError(`Input ${i + 1}: nome é obrigatório`); return; }
    }

    let contextSources: unknown = [{ type: 'specs', enabled: true, config: {} }];
    try { contextSources = JSON.parse(contextSourcesJson.trim()); } catch { /* keep default */ }

    const normalizedSteps = executionSteps
      .map((s, i) => ({ name: (s.name ?? `step_${i + 1}`).trim(), type: s.type ?? 'analysis', description: s.description?.trim() || undefined, promptTemplateOverride: s.promptTemplateOverride?.trim() || undefined }))
      .filter(s => s.promptTemplateOverride);

    setLoading(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        specId: selectedSpec,
        promptTemplate: promptTemplate.trim() || '{{text}}',
        executionSteps: normalizedSteps.length ? normalizedSteps : undefined,
        contextSources,
        inputFields: inputFields
          .filter(f => f.name.trim())
          .map((field) => ({
            ...field,
            options: field.options?.filter(Boolean) ?? [],
          })),
        outputBlocks,
        methodRules,
      };
      if (isEdit && agent) {
        await managedAgentsApi.update(agent.id, payload);
      } else {
        await managedAgentsApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const sxField = { bgcolor: alpha(theme.palette.background.default, 0.5) };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { height: '90vh', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, pb: 1 }}>
        <SmartToyRoundedIcon sx={{ color: theme.palette.primary.main }} />
        {isEdit ? 'Editar Agente' : 'Novo Agente'}
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: '13px', textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Configuração" />
        <Tab label="Inputs" />
        <Tab label="Output" />
        <Tab label="Método" />
      </Tabs>

      <DialogContent sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
        {/* Tab 0 — Configuração */}
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Nome" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Analisador de Contratos" sx={sxField} />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Spec Vinculada</InputLabel>
                <Select value={selectedSpec} label="Spec Vinculada" onChange={e => setSelectedSpec(e.target.value)} sx={sxField}>
                  {specs.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField label="Descrição" fullWidth size="small" value={description} onChange={e => setDescription(e.target.value)} sx={sxField} />
            <TextField label="Prompt Template" fullWidth multiline rows={4} size="small" value={promptTemplate} onChange={e => setPromptTemplate(e.target.value)} InputProps={{ sx: { fontFamily: 'monospace', fontSize: '12px' } }} sx={sxField} helperText="Use {{campo}} para referenciar variáveis do contexto" />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight={700}>Passos de Execução</Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addStep}>Passo</Button>
            </Box>
            {executionSteps.map((step, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: expandedStepIdx === idx ? 1.5 : 0 }}>
                  <Chip label={String(idx + 1).padStart(2, '0')} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                  <TextField size="small" value={step.name ?? ''} placeholder={`step_${idx + 1}`} onChange={e => updateStep(idx, 'name', e.target.value)} sx={{ flex: 1, ...sxField }} />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select value={step.type ?? 'analysis'} onChange={e => updateStep(idx, 'type', e.target.value)}>
                      {STEP_TYPES.map(t => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <IconButton size="small" onClick={() => moveStep(idx, -1)} disabled={idx === 0}><KeyboardArrowUpRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => moveStep(idx, 1)} disabled={idx === executionSteps.length - 1}><KeyboardArrowDownRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => removeStep(idx)} disabled={executionSteps.length <= 1}><DeleteRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setExpandedStepIdx(expandedStepIdx === idx ? null : idx)}>
                    {expandedStepIdx === idx ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                  </IconButton>
                </Box>
                {expandedStepIdx === idx && (
                  <TextField fullWidth multiline rows={3} size="small" label="Prompt deste passo (override)" value={step.promptTemplateOverride ?? ''} onChange={e => updateStep(idx, 'promptTemplateOverride', e.target.value)} InputProps={{ sx: { fontFamily: 'monospace', fontSize: '12px' } }} sx={sxField} />
                )}
              </Paper>
            ))}

            <TextField label="Context Sources (JSON)" fullWidth multiline rows={2} size="small" value={contextSourcesJson} onChange={e => setContextSourcesJson(e.target.value)} InputProps={{ sx: { fontFamily: 'monospace', fontSize: '12px' } }} sx={sxField} />
          </Box>
        )}

        {/* Tab 1 — Inputs */}
        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Campos de Entrada</Typography>
                <Typography variant="caption" color="text.secondary">Defina quais dados o agente precisa receber</Typography>
              </Box>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addInputField}>Campo</Button>
            </Box>

            {inputFields.length === 0 && (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                <Typography variant="body2" color="text.secondary">Nenhum campo definido. Clique em "+ Campo" para adicionar.</Typography>
              </Paper>
            )}

            {inputFields.map((field, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Chip label={String(i + 1).padStart(2, '0')} size="small" sx={{ fontFamily: 'monospace' }} />
                  <IconButton size="small" color="error" onClick={() => removeInputField(i)}><DeleteRoundedIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField size="small" label="Nome do campo" value={field.name} onChange={e => updateInputField(i, 'name', e.target.value)} InputProps={{ sx: { fontFamily: 'monospace' } }} sx={sxField} />
                  <FormControl size="small">
                    <InputLabel>Classificação</InputLabel>
                    <Select value={field.classification} label="Classificação" onChange={e => updateInputField(i, 'classification', e.target.value)} sx={sxField}>
                      <MenuItem value="OBRIGATORIO"><Typography color="error" fontWeight={600}>OBRIGATÓRIO</Typography></MenuItem>
                      <MenuItem value="DESEJAVEL"><Typography sx={{ color: '#FFC107' }} fontWeight={600}>DESEJÁVEL</Typography></MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Tipo de dado</InputLabel>
                    <Select value={field.dataType ?? 'Texto'} label="Tipo de dado" onChange={e => updateInputField(i, 'dataType', e.target.value)} sx={sxField}>
                      {['Texto', 'Texto longo', 'Número', 'Seleção', 'JSON'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Se ausente</InputLabel>
                    <Select value={field.behaviorIfAbsent ?? 'BLOCK'} label="Se ausente" onChange={e => updateInputField(i, 'behaviorIfAbsent', e.target.value)} sx={sxField}>
                      <MenuItem value="BLOCK">BLOCK — bloquear e perguntar</MenuItem>
                      <MenuItem value="ASK">ASK — perguntar antes</MenuItem>
                      <MenuItem value="ASSUME">ASSUME — assumir padrão</MenuItem>
                      <MenuItem value="MENU">MENU — apresentar opções</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField fullWidth size="small" label="Descrição" value={field.description ?? ''} onChange={e => updateInputField(i, 'description', e.target.value)} sx={{ mt: 1.5, ...sxField }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1.5 }}>
                  <TextField size="small" label="Exemplo de valor válido" value={field.validExample ?? ''} onChange={e => updateInputField(i, 'validExample', e.target.value)} sx={sxField} />
                  <TextField size="small" label="Fallback / Padrão (ASSUME)" value={field.defaultOrFallback ?? ''} onChange={e => updateInputField(i, 'defaultOrFallback', e.target.value)} sx={sxField} />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Opções (MENU / Seleção)"
                  placeholder="Ex: Alta, Média, Baixa"
                  value={(field.options ?? []).join(', ')}
                  onChange={e => updateInputField(i, 'options', e.target.value.split(',').map(option => option.trim()).filter(Boolean))}
                  sx={{ mt: 1.5, ...sxField }}
                  helperText="Separe as opções por vírgula para campos do tipo Seleção ou comportamento MENU"
                />
              </Paper>
            ))}
          </Box>
        )}

        {/* Tab 2 — Output */}
        {tab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Blocos de Output</Typography>
              <Typography variant="caption" color="text.secondary">Ative os blocos que este agente deve gerar</Typography>
            </Box>
            {outputBlocks.map(block => (
              <Paper key={block.id} variant="outlined" sx={{
                p: 2,
                borderColor: block.enabled ? alpha(theme.palette.primary.main, 0.3) : undefined,
                bgcolor: block.enabled ? alpha(theme.palette.primary.main, 0.03) : undefined,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Checkbox checked={block.enabled} onChange={() => toggleOutputBlock(block.id)} sx={{ p: 0.5, mt: 0.3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: block.enabled ? 1.5 : 0 }}>
                      <Chip label={block.id} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700, height: 20, fontSize: '10px' }} />
                      <TextField variant="standard" size="small" value={block.name} onChange={e => updateOutputBlock(block.id, 'name', e.target.value)}
                        InputProps={{ disableUnderline: true, sx: { fontWeight: 600, fontSize: '14px' } }} sx={{ flex: 1 }} />
                    </Box>
                    {block.enabled && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        <FormControl size="small">
                          <InputLabel>Formato de entrega</InputLabel>
                          <Select value={block.deliveryFormat ?? 'Texto'} label="Formato de entrega" onChange={e => updateOutputBlock(block.id, 'deliveryFormat', e.target.value)} sx={sxField}>
                            {DELIVERY_FORMATS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField size="small" label="Critério de qualidade" value={block.qualityCriteria ?? ''} onChange={e => updateOutputBlock(block.id, 'qualityCriteria', e.target.value)} sx={sxField} />
                        <TextField size="small" label="Descrição do conteúdo" fullWidth value={block.description ?? ''} onChange={e => updateOutputBlock(block.id, 'description', e.target.value)} sx={{ gridColumn: '1 / -1', ...sxField }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Tab 3 — Método */}
        {tab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Método — Regras de Comportamento</Typography>
              <Typography variant="caption" color="text.secondary">Define como o agente deve agir em cada cenário de input</Typography>
            </Box>
            {methodRules.map((rule, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip label={i + 1} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                  <Typography variant="body2" fontWeight={600}>{rule.scenario}</Typography>
                </Box>
                <TextField fullWidth multiline rows={2} size="small" label="Comportamento do agente" value={rule.agentBehavior} onChange={e => updateMethodRule(i, 'agentBehavior', e.target.value)} sx={{ mb: 1.5, ...sxField }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField size="small" label="Tentativas máximas" type="number" value={rule.maxAttempts ?? ''} onChange={e => updateMethodRule(i, 'maxAttempts', e.target.value ? parseInt(e.target.value) : null)}
                    inputProps={{ min: 1, max: 10 }} sx={sxField} />
                  <TextField size="small" label="Fallback / Padrão" value={rule.fallback ?? ''} onChange={e => updateMethodRule(i, 'fallback', e.target.value || null)} sx={sxField} />
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {error && <Typography variant="body2" color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, borderTop: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : isEdit ? 'Salvar Agente' : 'Criar Agente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
