import axios from 'axios';
import {
  Agent,
  ChatMessage,
  WorkflowJob,
  WorkflowCatalogEntry,
  AppConfig,
  LLMMode,
  LLMProvider,
} from '../types';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

export const agentsApi = {
  list: async (): Promise<Agent[]> => {
    const { data } = await api.get<{ success: boolean; data: Agent[] }>('/agents');
    return data.data;
  },
  get: async (id: string): Promise<Agent> => {
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
    const { data } = await api.post<{ success: boolean; data: ChatMessage }>('/chat', params);
    return data.data;
  },
};

export const workflowApi = {
  getCatalog: async (): Promise<WorkflowCatalogEntry[]> => {
    const { data } = await api.get<{ success: boolean; data: WorkflowCatalogEntry[] }>('/workflow/catalog');
    return data.data;
  },
  getWorkflow: async (id: string): Promise<WorkflowCatalogEntry> => {
    const { data } = await api.get<{ success: boolean; data: WorkflowCatalogEntry }>(`/workflow/catalog/${id}`);
    return data.data;
  },
  createWorkflow: async (workflow: WorkflowCatalogEntry): Promise<WorkflowCatalogEntry> => {
    const { data } = await api.post<{ success: boolean; data: WorkflowCatalogEntry }>('/workflow/catalog', workflow);
    return data.data;
  },
  updateWorkflow: async (id: string, workflow: WorkflowCatalogEntry): Promise<WorkflowCatalogEntry> => {
    const { data } = await api.put<{ success: boolean; data: WorkflowCatalogEntry }>(`/workflow/catalog/${id}`, workflow);
    return data.data;
  },
  run: async (params: {
    workflowId: string;
    projectName: string;
    inputs: Record<string, string>;
    apiKey?: string;
    startFromStep?: number;
  }): Promise<{ jobId: string; workflowName: string; totalSteps: number }> => {
    const { data } = await api.post<{ success: boolean; data: { jobId: string; workflowName: string; totalSteps: number } }>('/workflow/run', params);
    return data.data;
  },
  getJob: async (jobId: string): Promise<WorkflowJob> => {
    const { data } = await api.get<{ success: boolean; data: WorkflowJob }>(`/workflow/jobs/${jobId}`);
    return data.data;
  },
  getAllJobs: async (workflowId?: string): Promise<WorkflowJob[]> => {
    const url = workflowId ? `/workflow/jobs?workflowId=${workflowId}` : '/workflow/jobs';
    const { data } = await api.get<{ success: boolean; data: WorkflowJob[] }>(url);
    return data.data;
  },
};

export const configApi = {
  get: async (): Promise<AppConfig & { mockMode: boolean }> => {
    const { data } = await api.get('/config');
    return data;
  },
  health: async (): Promise<{ status: string; mockMode: boolean }> => {
    const { data } = await api.get('/health');
    return data;
  },
};
