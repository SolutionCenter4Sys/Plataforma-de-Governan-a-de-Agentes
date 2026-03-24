import axios from 'axios';
import {
  Agent,
  ChatMessage,
  WorkflowJob,
  WorkflowCatalogEntry,
  AppConfig,
  LLMMode,
  LLMProvider,
  Spec,
  ManagedAgent,
  InputField,
  OutputBlock,
  MethodRule,
  ManagedWorkflow,
  WorkflowStepConfig,
  Run,
  ObservabilityLog,
  ObservabilityLogLevel,
  ObservabilityStats,
  ExecutionDetail,
  VersionEntry,
  VersionComparison,
} from '../types';
import { normalizeRun, normalizeWorkflowJob } from './executionAdapters';
import { mockApi } from './mockApi';

const api = axios.create({ baseURL: '/api', timeout: 120000 });
const VERSION_STORAGE_KEY = 'bmad-versioning-fallback';
const FRONTEND_ONLY_MOCK = import.meta.env.VITE_FRONTEND_ONLY_MOCK === 'true';

function readStoredVersions(): VersionEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(VERSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as VersionEntry[] : [];
  } catch {
    return [];
  }
}

function persistStoredVersions(versions: VersionEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
}

function summarizeComparison(left: VersionEntry, right: VersionEntry): string[] {
  const summary: string[] = [];
  if (left.version !== right.version) summary.push(`Versão ${left.version} vs ${right.version}`);
  if (left.status !== right.status) summary.push(`Status ${left.status} vs ${right.status}`);
  if (left.executionCount !== right.executionCount) summary.push(`Execuções ${left.executionCount} vs ${right.executionCount}`);
  const leftChanges = new Set(left.changes);
  right.changes.forEach((change) => {
    if (!leftChanges.has(change)) summary.push(`Mudança exclusiva: ${change}`);
  });
  return summary.length > 0 ? summary : ['Sem diferenças estruturais detalhadas retornadas pela API.'];
}

async function buildVersionFallback(): Promise<VersionEntry[]> {
  const stored = readStoredVersions();
  if (stored.length > 0) return stored;

  const now = new Date().toISOString();
  const [specs, agents, workflows] = await Promise.all([
    specsApi.list().catch(() => []),
    managedAgentsApi.list().catch(() => []),
    managedWorkflowsApi.list().catch(() => []),
  ]);

  const versions: VersionEntry[] = [
    ...specs.map((spec) => ({
      id: `spec-${spec.id}-${spec.version}`,
      entity: 'spec' as const,
      entityId: spec.id,
      entityName: spec.name,
      version: spec.version,
      status: 'active' as const,
      createdAt: spec.createdAt,
      updatedAt: spec.updatedAt,
      createdBy: 'system',
      executionCount: 0,
      changes: ['Snapshot atual sincronizado do cadastro de specs'],
      metadata: { source: 'fallback' },
    })),
    ...agents.map((agent) => ({
      id: `agent-${agent.id}-${agent.updatedAt}`,
      entity: 'agent' as const,
      entityId: agent.id,
      entityName: agent.name,
      version: agent.updatedAt ? new Date(agent.updatedAt).toISOString() : now,
      status: 'active' as const,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      createdBy: 'system',
      executionCount: 0,
      changes: [
        `${agent.inputFields?.length ?? 0} campo(s) de input`,
        `${agent.outputBlocks?.length ?? 0} bloco(s) de output`,
      ],
      metadata: { source: 'fallback' },
    })),
    ...workflows.map((workflow) => ({
      id: `workflow-${workflow.id}-${workflow.version}`,
      entity: 'workflow' as const,
      entityId: workflow.id,
      entityName: workflow.name,
      version: workflow.version,
      status: 'active' as const,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      createdBy: 'system',
      executionCount: 0,
      changes: [`${workflow.steps?.length ?? 0} step(s) configurado(s)`],
      metadata: { source: 'fallback' },
    })),
  ];

  persistStoredVersions(versions);
  return versions;
}

export const agentsApi = {
  list: async (): Promise<Agent[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.agents.list();
    const { data } = await api.get<{ success: boolean; data: Agent[] }>('/agents');
    return data.data;
  },
  get: async (id: string): Promise<Agent> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.agents.get(id);
    const { data } = await api.get<{ success: boolean; data: Agent }>(`/agents/${id}`);
    return data.data;
  },
};

export const chatApi = {
  send: async (params: {
    agentId: string;
    message: string;
    history: ChatMessage[];
    mode: LLMMode;
    provider: LLMProvider;
    model: string;
    apiKey?: string;
  }): Promise<ChatMessage> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.chat.send(params);
    const { data } = await api.post<{ success: boolean; data: ChatMessage }>('/chat', params);
    return data.data;
  },
};

export const workflowApi = {
  getCatalog: async (): Promise<WorkflowCatalogEntry[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.getCatalog();
    const { data } = await api.get<{ success: boolean; data: WorkflowCatalogEntry[] }>('/workflow/catalog');
    return data.data;
  },
  getWorkflow: async (id: string): Promise<WorkflowCatalogEntry> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.getWorkflow(id);
    const { data } = await api.get<{ success: boolean; data: WorkflowCatalogEntry }>(`/workflow/catalog/${id}`);
    return data.data;
  },
  createWorkflow: async (workflow: WorkflowCatalogEntry): Promise<WorkflowCatalogEntry> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.createWorkflow(workflow);
    const { data } = await api.post<{ success: boolean; data: WorkflowCatalogEntry }>('/workflow/catalog', workflow);
    return data.data;
  },
  updateWorkflow: async (id: string, workflow: WorkflowCatalogEntry): Promise<WorkflowCatalogEntry> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.updateWorkflow(id, workflow);
    const { data } = await api.put<{ success: boolean; data: WorkflowCatalogEntry }>(`/workflow/catalog/${id}`, workflow);
    return data.data;
  },
  run: async (params: {
    workflowId: string;
    projectName: string;
    inputs: Record<string, string>;
    agentFields?: Record<string, Record<string, unknown>>;
    apiKey?: string;
    startFromStep?: number;
  }): Promise<{ jobId: string; workflowName: string; totalSteps: number }> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.run(params);
    const { data } = await api.post<{ success: boolean; data: { jobId: string; workflowName: string; totalSteps: number } }>('/workflow/run', params);
    return data.data;
  },
  getJob: async (jobId: string): Promise<WorkflowJob> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.getJob(jobId);
    const { data } = await api.get<{ success: boolean; data: WorkflowJob }>(`/workflow/jobs/${jobId}`);
    return data.data;
  },
  getAllJobs: async (workflowId?: string): Promise<WorkflowJob[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.workflow.getAllJobs(workflowId);
    const url = workflowId ? `/workflow/jobs?workflowId=${workflowId}` : '/workflow/jobs';
    const { data } = await api.get<{ success: boolean; data: WorkflowJob[] }>(url);
    return data.data;
  },
};

export const configApi = {
  get: async (): Promise<AppConfig & { mockMode: boolean }> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.config.get();
    const { data } = await api.get('/config');
    return data;
  },
  health: async (): Promise<{ status: string; mockMode: boolean }> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.config.health();
    const { data } = await api.get('/health');
    return data;
  },
};

/* ── Specs CRUD ─────────────────────────────────────────────────────────────── */

export const specsApi = {
  list: async (): Promise<Spec[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.specs.list();
    const { data } = await api.get<Spec[]>('/specs');
    return data;
  },
  get: async (id: string): Promise<Spec> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.specs.get(id);
    const { data } = await api.get<Spec>(`/specs/${id}`);
    return data;
  },
  create: async (payload: { name: string; description?: string; content: string; version: string }): Promise<Spec> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.specs.create(payload);
    const { data } = await api.post<Spec>('/specs', payload);
    return data;
  },
  update: async (id: string, payload: Partial<{ name: string; description: string; content: string; version: string }>): Promise<Spec> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.specs.update(id, payload);
    const { data } = await api.put<Spec>(`/specs/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.specs.delete(id);
    await api.delete(`/specs/${id}`);
  },
};

/* ── Managed Agents CRUD ────────────────────────────────────────────────────── */

export const managedAgentsApi = {
  list: async (): Promise<ManagedAgent[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedAgents.list();
    const { data } = await api.get<ManagedAgent[]>('/agents');
    return data;
  },
  get: async (id: string): Promise<ManagedAgent> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedAgents.get(id);
    const { data } = await api.get<ManagedAgent>(`/agents/${id}`);
    return data;
  },
  create: async (payload: {
    name: string;
    description?: string;
    specId: string;
    promptTemplate: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    executionSteps?: unknown;
    contextSources?: unknown;
    status?: string;
    inputFields?: InputField[];
    outputBlocks?: OutputBlock[];
    methodRules?: MethodRule[];
  }): Promise<ManagedAgent> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedAgents.create(payload);
    const { data } = await api.post<ManagedAgent>('/agents', payload);
    return data;
  },
  update: async (id: string, payload: Partial<{
    name: string;
    description: string;
    specId: string;
    promptTemplate: string;
    executionSteps: unknown;
    contextSources: unknown;
    inputFields: InputField[];
    outputBlocks: OutputBlock[];
    methodRules: MethodRule[];
  }>): Promise<ManagedAgent> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedAgents.update(id, payload);
    const { data } = await api.put<ManagedAgent>(`/agents/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedAgents.delete(id);
    await api.delete(`/agents/${id}`);
  },
};

/* ── Managed Workflows CRUD ─────────────────────────────────────────────────── */

export const managedWorkflowsApi = {
  list: async (): Promise<ManagedWorkflow[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedWorkflows.list();
    const { data } = await api.get<ManagedWorkflow[]>('/workflows');
    return data;
  },
  get: async (id: string): Promise<ManagedWorkflow> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedWorkflows.get(id);
    const { data } = await api.get<ManagedWorkflow>(`/workflows/${id}`);
    return data;
  },
  create: async (payload: {
    name: string;
    version: string;
    steps: { order: number; type: string; config: WorkflowStepConfig }[];
  }): Promise<ManagedWorkflow> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedWorkflows.create(payload);
    const { data } = await api.post<ManagedWorkflow>('/workflows', payload);
    return data;
  },
  update: async (id: string, payload: Partial<{
    name: string;
    version: string;
    steps: { order: number; type: string; config: WorkflowStepConfig }[];
  }>): Promise<ManagedWorkflow> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedWorkflows.update(id, payload);
    const { data } = await api.put<ManagedWorkflow>(`/workflows/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.managedWorkflows.delete(id);
    await api.delete(`/workflows/${id}`);
  },
};

/* ── Runs ────────────────────────────────────────────────────────────────────── */

export const runsApi = {
  list: async (limit?: number): Promise<Run[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.runs.list(limit);
    const q = limit != null ? `?limit=${limit}` : '';
    const { data } = await api.get<Run[]>(`/runs${q}`);
    return data;
  },
  get: async (id: string): Promise<Run> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.runs.get(id);
    const { data } = await api.get<Run>(`/runs/${id}`);
    return data;
  },
  start: async (workflowId: string, input: Record<string, unknown> = {}): Promise<{ runId: string }> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.runs.start(workflowId, input);
    const { data } = await api.post<{ runId: string }>('/runs', { workflowId, input });
    return data;
  },
};

/* ── Execuções normalizadas ─────────────────────────────────────────────────── */

export const executionApi = {
  list: async (workflowId?: string): Promise<ExecutionDetail[]> => {
    const jobs = await workflowApi.getAllJobs(workflowId);
    return jobs.map(normalizeWorkflowJob);
  },
  get: async (id: string): Promise<ExecutionDetail> => {
    try {
      const run = await runsApi.get(id);
      return normalizeRun(run);
    } catch {
      const job = await workflowApi.getJob(id);
      return normalizeWorkflowJob(job);
    }
  },
};

/* ── Observabilidade ─────────────────────────────────────────────────────────── */

export const observabilityApi = {
  getLogs: async (params?: {
    executionId?: string;
    level?: ObservabilityLogLevel | 'all';
    search?: string;
    limit?: number;
  }): Promise<ObservabilityLog[]> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.observability.getLogs(params);
    const q = new URLSearchParams();
    if (params?.executionId) q.set('executionId', params.executionId);
    if (params?.level && params.level !== 'all') q.set('level', params.level);
    if (params?.search) q.set('search', params.search);
    if (params?.limit != null) q.set('limit', String(params.limit));
    const qs = q.toString();
    const { data } = await api.get<ObservabilityLog[]>(`/observability/logs${qs ? `?${qs}` : ''}`);
    return data;
  },
  getStats: async (): Promise<ObservabilityStats> => {
    if (FRONTEND_ONLY_MOCK) return mockApi.observability.getStats();
    const { data } = await api.get<ObservabilityStats>('/observability/stats');
    return data;
  },
};

/* ── Versionamento ───────────────────────────────────────────────────────────── */

export const versionsApi = {
  list: async (params?: {
    entity?: VersionEntry['entity'] | 'all';
  }): Promise<VersionEntry[]> => {
    if (FRONTEND_ONLY_MOCK) {
      const fallback = await buildVersionFallback();
      return params?.entity && params.entity !== 'all'
        ? fallback.filter((entry) => entry.entity === params.entity)
        : fallback;
    }
    try {
      const q = new URLSearchParams();
      if (params?.entity && params.entity !== 'all') q.set('entity', params.entity);
      const qs = q.toString();
      const { data } = await api.get<VersionEntry[]>(`/versions${qs ? `?${qs}` : ''}`);
      return data;
    } catch {
      const fallback = await buildVersionFallback();
      return params?.entity && params.entity !== 'all'
        ? fallback.filter((entry) => entry.entity === params.entity)
        : fallback;
    }
  },
  compare: async (leftId: string, rightId: string): Promise<VersionComparison> => {
    if (FRONTEND_ONLY_MOCK) {
      const versions = await buildVersionFallback();
      const left = versions.find((entry) => entry.id === leftId);
      const right = versions.find((entry) => entry.id === rightId);
      if (!left || !right) throw new Error('Versões não encontradas para comparação.');
      return { left, right, summary: summarizeComparison(left, right) };
    }
    try {
      const { data } = await api.get<VersionComparison>(`/versions/compare?left=${leftId}&right=${rightId}`);
      return data;
    } catch {
      const versions = await buildVersionFallback();
      const left = versions.find((entry) => entry.id === leftId);
      const right = versions.find((entry) => entry.id === rightId);
      if (!left || !right) throw new Error('Versões não encontradas para comparação.');
      return { left, right, summary: summarizeComparison(left, right) };
    }
  },
  lock: async (id: string): Promise<VersionEntry> => {
    if (FRONTEND_ONLY_MOCK) {
      const versions = await buildVersionFallback();
      const updated = versions.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: 'locked' as const,
              lockedAt: new Date().toISOString(),
              lockedBy: 'frontend-fallback',
            }
          : entry,
      );
      persistStoredVersions(updated);
      const result = updated.find((entry) => entry.id === id);
      if (!result) throw new Error('Versão não encontrada para travamento.');
      return result;
    }
    try {
      const { data } = await api.post<VersionEntry>(`/versions/${id}/lock`);
      return data;
    } catch {
      const versions = await buildVersionFallback();
      const updated = versions.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: 'locked' as const,
              lockedAt: new Date().toISOString(),
              lockedBy: 'frontend-fallback',
            }
          : entry,
      );
      persistStoredVersions(updated);
      const result = updated.find((entry) => entry.id === id);
      if (!result) throw new Error('Versão não encontrada para travamento.');
      return result;
    }
  },
  rollback: async (id: string): Promise<VersionEntry> => {
    if (FRONTEND_ONLY_MOCK) {
      const versions = await buildVersionFallback();
      const target = versions.find((entry) => entry.id === id);
      if (!target) throw new Error('Versão não encontrada para rollback.');
      const updated = versions.map((entry) => {
        if (entry.entityId !== target.entityId || entry.entity !== target.entity) return entry;
        if (entry.id === target.id) {
          return { ...entry, status: 'active' as const };
        }
        if (entry.status === 'active') {
          return { ...entry, status: 'locked' as const, lockedAt: new Date().toISOString(), lockedBy: 'frontend-fallback' };
        }
        return entry;
      });
      persistStoredVersions(updated);
      return updated.find((entry) => entry.id === id)!;
    }
    try {
      const { data } = await api.post<VersionEntry>(`/versions/${id}/rollback`);
      return data;
    } catch {
      const versions = await buildVersionFallback();
      const target = versions.find((entry) => entry.id === id);
      if (!target) throw new Error('Versão não encontrada para rollback.');
      const updated = versions.map((entry) => {
        if (entry.entityId !== target.entityId || entry.entity !== target.entity) return entry;
        if (entry.id === target.id) {
          return { ...entry, status: 'active' as const };
        }
        if (entry.status === 'active') {
          return { ...entry, status: 'locked' as const, lockedAt: new Date().toISOString(), lockedBy: 'frontend-fallback' };
        }
        return entry;
      });
      persistStoredVersions(updated);
      return updated.find((entry) => entry.id === id)!;
    }
  },
};
