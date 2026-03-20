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
