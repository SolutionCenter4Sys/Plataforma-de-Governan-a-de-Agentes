export interface Agent {
  id: string;
  name: string;
  title: string;
  icon: string;
  module: string;
  description: string;
  role: string;
  filePath: string;
}

export interface WorkflowStep {
  step_order: string;
  step_name: string;
  step_description: string;
  run_count: string;
  agents: string[];
  deliverables: string;
  template: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId: string;
  timestamp: string;
  tokens?: { input: number; output: number };
}

export interface WorkflowCatalogStep {
  order: number;
  name: string;
  agent: string;
  run_count: string;
  icon: string;
}

export interface WorkflowCatalogInput {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  default?: string;
}

export interface WorkflowCatalogEntry {
  id: string;
  name: string;
  description: string;
  module: string;
  category: string;
  icon: string;
  color: string;
  agents: string[];
  steps: WorkflowCatalogStep[];
  inputs: WorkflowCatalogInput[];
  type: string;
  estimatedTime: string;
  tags: string[];
}

export interface WorkflowJob {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'done' | 'error';
  currentStep: number;
  totalSteps: number;
  projectName: string;
  logs: string[];
  result?: Record<string, string>;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

export type LLMMode = 'agent' | 'plan' | 'ask' | 'bug';
export type LLMProvider = 'mock' | 'anthropic' | 'openai';

export interface AppConfig {
  mockMode: boolean;
  availableModels: {
    anthropic: string[];
    openai: string[];
  };
}

/* ── Specs ──────────────────────────────────────────────────────────────────── */

export interface Spec {
  id: string;
  name: string;
  description: string | null;
  content: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Managed Agent (CRUD rico) ─────────────────────────────────────────────── */

export type InputFieldClassification = 'OBRIGATORIO' | 'DESEJAVEL';
export type InputFieldBehaviorIfAbsent = 'ASK' | 'BLOCK' | 'ASSUME' | 'MENU';
export type InputFieldDataType = 'Texto' | 'Texto longo' | 'Número' | 'Seleção' | 'JSON';

export interface InputField {
  name: string;
  description?: string;
  classification: InputFieldClassification;
  dataType?: InputFieldDataType;
  behaviorIfAbsent?: InputFieldBehaviorIfAbsent;
  options?: string[];
  defaultOrFallback?: string;
  validExample?: string;
}

export interface OutputBlock {
  id: string;
  name: string;
  description?: string;
  deliveryFormat?: string;
  qualityCriteria?: string;
  enabled: boolean;
}

export interface MethodRule {
  scenario: string;
  agentBehavior: string;
  actionIfMandatoryAbsent?: string;
  actionIfOptionalAbsent?: string;
  maxAttempts?: number | null;
  fallback?: string | null;
}

export interface ManagedAgent {
  id: string;
  name: string;
  description: string | null;
  specId: string;
  spec?: { id: string; name: string };
  promptTemplate: string;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  executionSteps?: unknown;
  contextSources?: unknown;
  status?: string | null;
  inputFields?: InputField[] | null;
  outputBlocks?: OutputBlock[] | null;
  methodRules?: MethodRule[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecutionStep {
  name?: string;
  type?: string;
  description?: string;
  promptTemplateOverride?: string;
}

/* ── Managed Workflows ─────────────────────────────────────────────────────── */

export type WorkflowStepConfig =
  | { type: 'llm'; agentId: string }
  | { type: 'parallel'; branches: { agentId: string; outputKey?: string }[] };

export interface ManagedWorkflowStep {
  id?: string;
  order: number;
  type: string;
  config: WorkflowStepConfig;
}

export interface ManagedWorkflow {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  steps?: ManagedWorkflowStep[];
}

/* ── Runs ───────────────────────────────────────────────────────────────────── */

export interface RunStep {
  id: string;
  workflowStepId: string;
  workflowStep?: { type: string };
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  durationMs: number | null;
  logs: string[];
  createdAt: string;
}

export interface Run {
  id: string;
  workflowId: string;
  workflow?: { id: string; name: string; version: string };
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  steps?: RunStep[];
}

/* ── Execuções normalizadas ─────────────────────────────────────────────────── */

export type ExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export interface ExecutionStep {
  id: string;
  key: string;
  label: string;
  status: ExecutionStatus;
  type: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  markdown?: string | null;
  durationMs: number | null;
  logs: string[];
}

export interface ExecutionDetail {
  id: string;
  source: 'job' | 'run';
  workflowId: string;
  workflowName: string;
  projectName: string;
  status: ExecutionStatus;
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  finishedAt?: string;
  durationMs: number | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  logs: string[];
  error?: string;
  steps: ExecutionStep[];
}

/* ── Observabilidade ────────────────────────────────────────────────────────── */

export type ObservabilityLogLevel = 'info' | 'warn' | 'error' | 'debug' | 'decision';

export interface ObservabilityDecision {
  reasoning: string;
  confidence: number;
  alternatives: string[];
}

export interface ObservabilityLog {
  id: string;
  timestamp: string;
  level: ObservabilityLogLevel;
  source: string;
  agent: string;
  executionId: string;
  message: string;
  details?: string | null;
  stepName?: string | null;
  decision?: ObservabilityDecision | null;
}

export interface ObservabilityStats {
  total: number;
  decisions: number;
  warnings: number;
  errors: number;
}

/* ── Versionamento ──────────────────────────────────────────────────────────── */

export interface VersionEntry {
  id: string;
  entity: 'spec' | 'agent' | 'workflow';
  entityId: string;
  entityName: string;
  version: string;
  status: 'active' | 'locked' | 'deprecated';
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  executionCount: number;
  changes: string[];
  lockedAt?: string;
  lockedBy?: string;
  metadata?: Record<string, unknown> | null;
}

export interface VersionComparison {
  left: VersionEntry;
  right: VersionEntry;
  summary: string[];
}

/* ── Constantes ─────────────────────────────────────────────────────────────── */

export const MODULE_LABELS: Record<string, string> = {
  bmm:          'BMad Method',
  bmb:          'BMad Builder',
  bmgd:         'Game Dev',
  cis:          'Creative Innovation',
  core:         'Core',
  upstream:     'UpStream',
  downstream:   'DownStream',
  qualidade:    'Qualidade',
  habilitadores:'Habilitadores',
};

export const MODULE_COLORS: Record<string, string> = {
  bmm:          '#1565C0',
  bmb:          '#6A1B9A',
  bmgd:         '#2E7D32',
  cis:          '#E65100',
  core:         '#222239',
  upstream:     '#FF5315',
  downstream:   '#00897B',
  qualidade:    '#F9A825',
  habilitadores:'#5C6BC0',
};
