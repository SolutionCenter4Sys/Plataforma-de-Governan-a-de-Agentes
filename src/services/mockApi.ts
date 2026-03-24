import {
  Agent,
  AppConfig,
  ChatMessage,
  ManagedAgent,
  ManagedWorkflow,
  MethodRule,
  ObservabilityLog,
  ObservabilityLogLevel,
  ObservabilityStats,
  OutputBlock,
  Run,
  RunStep,
  Spec,
  WorkflowCatalogEntry,
  WorkflowCatalogInput,
  WorkflowCatalogStep,
  WorkflowJob,
  WorkflowStepConfig,
} from '../types';

const STORAGE_KEY = 'bmad-frontend-only-mock-db';
const STEP_DURATION_MS = 1800;

interface MockDb {
  specs: Spec[];
  managedAgents: ManagedAgent[];
  catalogAgents: Agent[];
  managedWorkflows: ManagedWorkflow[];
  workflowCatalog: WorkflowCatalogEntry[];
  jobs: WorkflowJob[];
  runs: Run[];
  logs: ObservabilityLog[];
  config: AppConfig & { mockMode: boolean };
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildInputFields(agentName: string) {
  return [
    {
      name: 'contextoPrincipal',
      description: `Contexto principal para o agente ${agentName}`,
      classification: 'OBRIGATORIO' as const,
      dataType: 'Texto longo' as const,
      behaviorIfAbsent: 'BLOCK' as const,
      validExample: 'Objetivo, restrições e escopo do problema',
      options: [],
    },
    {
      name: 'criticidade',
      description: 'Nível de criticidade ou prioridade',
      classification: 'DESEJAVEL' as const,
      dataType: 'Seleção' as const,
      behaviorIfAbsent: 'MENU' as const,
      options: ['Alta', 'Média', 'Baixa'],
      validExample: 'Alta',
    },
    {
      name: 'premissasAssumidas',
      description: 'Premissas que podem ser assumidas pelo agente',
      classification: 'DESEJAVEL' as const,
      dataType: 'Texto' as const,
      behaviorIfAbsent: 'ASSUME' as const,
      defaultOrFallback: 'Sem premissas adicionais',
      options: [],
    },
  ];
}

function buildOutputBlocks(): OutputBlock[] {
  return [
    { id: 'ob-1', name: 'Resumo Executivo', description: 'Síntese para tomada de decisão', deliveryFormat: 'Markdown', qualityCriteria: 'Clareza e objetividade', enabled: true },
    { id: 'ob-2', name: 'Dados Estruturados', description: 'Saída JSON com rastreabilidade', deliveryFormat: 'JSON', qualityCriteria: 'Consistência de chaves', enabled: true },
  ];
}

function buildMethodRules(): MethodRule[] {
  return [
    {
      scenario: 'Dados obrigatórios ausentes',
      agentBehavior: 'Pedir o complemento dos dados antes de seguir.',
      actionIfMandatoryAbsent: 'Perguntar objetivamente pelo dado faltante.',
      maxAttempts: 2,
      fallback: 'Registrar premissa assumida se permitido.',
    },
  ];
}

function seedSpecs(): Spec[] {
  return [
    {
      id: 'spec-juridico',
      name: 'Regras Jurídicas',
      description: 'Conjunto de regras de compliance e análise jurídica.',
      content: '# Regras Jurídicas\n\n- Validar cláusulas obrigatórias\n- Identificar riscos e inconsistências',
      version: '2.1.0',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'spec-produto',
      name: 'Regras de Produto',
      description: 'Critérios para descoberta e decomposição de soluções.',
      content: '# Regras de Produto\n\n- Gerar épicos\n- Detalhar features\n- Priorizar com critérios de valor',
      version: '1.4.0',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

function seedManagedAgents(): ManagedAgent[] {
  const agents = [
    {
      id: 'the-visionary',
      name: 'The Visionary',
      description: 'Especialista em visão, épicos e direcionamento estratégico.',
      specId: 'spec-produto',
      promptTemplate: 'Analise o contexto e gere visão estratégica em JSON.',
      inputSchema: null,
      outputSchema: null,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'the-explorer',
      name: 'The Explorer',
      description: 'Mapeia alternativas, riscos e oportunidades.',
      specId: 'spec-produto',
      promptTemplate: 'Explore alternativas e riscos.',
      inputSchema: null,
      outputSchema: null,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'the-architect',
      name: 'The Architect',
      description: 'Traduz a solução em arquitetura e estrutura técnica.',
      specId: 'spec-juridico',
      promptTemplate: 'Estruture a solução técnica.',
      inputSchema: null,
      outputSchema: null,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'dev-reactjs-esp',
      name: 'Dev ReactJS ESP',
      description: 'Implementa a solução na camada frontend.',
      specId: 'spec-produto',
      promptTemplate: 'Implemente as entregas de frontend em React.',
      inputSchema: null,
      outputSchema: null,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ] as const;

  return agents.map((agent) => ({
    ...agent,
    spec: { id: agent.specId, name: agent.specId === 'spec-produto' ? 'Regras de Produto' : 'Regras Jurídicas' },
    executionSteps: [{ name: 'analise', type: 'analysis', description: 'Analisa o contexto recebido.' }],
    contextSources: [{ type: 'specs', enabled: true, config: {} }],
    inputFields: buildInputFields(agent.name),
    outputBlocks: buildOutputBlocks(),
    methodRules: buildMethodRules(),
  }));
}

function managedToCatalogAgent(agent: ManagedAgent): Agent {
  const moduleById: Record<string, string> = {
    'the-visionary': 'upstream',
    'the-explorer': 'upstream',
    'the-architect': 'core',
    'dev-reactjs-esp': 'downstream',
  };
  const iconById: Record<string, string> = {
    'the-visionary': '🎯',
    'the-explorer': '🔎',
    'the-architect': '🏗️',
    'dev-reactjs-esp': '💻',
  };
  const titleById: Record<string, string> = {
    'the-visionary': 'Estratégia e Visão',
    'the-explorer': 'Descoberta e Exploração',
    'the-architect': 'Arquitetura Técnica',
    'dev-reactjs-esp': 'Implementação Frontend',
  };

  return {
    id: agent.id,
    name: agent.name,
    title: titleById[agent.id] ?? 'Especialista',
    icon: iconById[agent.id] ?? '🤖',
    module: moduleById[agent.id] ?? 'core',
    description: agent.description ?? '',
    role: agent.description ?? '',
    filePath: `agents/${agent.id}.md`,
  };
}

function seedManagedWorkflows(): ManagedWorkflow[] {
  return [
    {
      id: 'mw-produto-mvp',
      name: 'Pipeline Produto MVP',
      version: '1.0.0',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      steps: [
        { order: 1, type: 'llm', config: { type: 'llm', agentId: 'the-visionary' } },
        { order: 2, type: 'parallel', config: { type: 'parallel', branches: [{ agentId: 'the-explorer', outputKey: 'analiseMercado' }, { agentId: 'the-architect', outputKey: 'arquiteturaInicial' }] } },
        { order: 3, type: 'llm', config: { type: 'llm', agentId: 'dev-reactjs-esp' } },
      ],
    },
  ];
}

function seedWorkflowCatalog(): WorkflowCatalogEntry[] {
  const commonInputs: WorkflowCatalogInput[] = [
    { id: 'projectName', label: 'Nome do Projeto', type: 'text', required: true, placeholder: 'Ex: Plataforma de Governança' },
    { id: 'projectBrief', label: 'Contexto', type: 'textarea', required: true, placeholder: 'Descreva problema, objetivo e escopo' },
    { id: 'priority', label: 'Prioridade', type: 'select', required: false, options: ['Alta', 'Média', 'Baixa'], default: 'Média' },
  ];

  const productSteps: WorkflowCatalogStep[] = [
    { order: 1, name: 'Visão', agent: 'the-visionary', run_count: 'once', icon: '🎯' },
    { order: 2, name: 'Exploração + Arquitetura', agent: 'the-explorer+the-architect', run_count: 'once', icon: '🔀' },
    { order: 3, name: 'Implementação Frontend', agent: 'dev-reactjs-esp', run_count: 'once', icon: '💻' },
  ];

  return [
    {
      id: 'wf-produto-mvp',
      name: 'Produção MVP',
      description: 'Fluxo ponta a ponta para descoberta, definição e implementação inicial.',
      module: 'upstream',
      category: 'Desenvolvimento',
      icon: '⚡',
      color: '#FF5315',
      agents: ['the-visionary', 'the-explorer', 'the-architect', 'dev-reactjs-esp'],
      steps: productSteps,
      inputs: commonInputs,
      type: 'bmad-workflow',
      estimatedTime: '12 min',
      tags: ['Produto', 'Arquitetura', 'Frontend'],
    },
    {
      id: 'wf-analise-juridica',
      name: 'Análise Jurídica Guiada',
      description: 'Pipeline de análise com foco em rastreabilidade e recomendações.',
      module: 'core',
      category: 'Análise',
      icon: '⚖️',
      color: '#4CAF50',
      agents: ['the-architect', 'the-explorer'],
      steps: [
        { order: 1, name: 'Leitura Técnica', agent: 'the-architect', run_count: 'once', icon: '📘' },
        { order: 2, name: 'Riscos e Recomendações', agent: 'the-explorer', run_count: 'once', icon: '🛡️' },
      ],
      inputs: commonInputs,
      type: 'analysis-workflow',
      estimatedTime: '8 min',
      tags: ['Jurídico', 'Riscos'],
    },
  ];
}

function stepMarkdown(workflow: WorkflowCatalogEntry, step: WorkflowCatalogStep, stepIndex: number, projectName: string): string {
  return [
    `# ${step.name}`,
    '',
    `Projeto: ${projectName}`,
    `Workflow: ${workflow.name}`,
    '',
    `## Resultado do passo ${stepIndex + 1}`,
    '',
    `O agente \`${step.agent}\` executou a etapa **${step.name}** e gerou um mock funcional para navegação e testes do frontend.`,
    '',
    '- Entradas interpretadas com sucesso',
    '- Saída estruturada em formato Markdown',
    '- Rastreabilidade disponível na linha do tempo',
  ].join('\n');
}

function materializeJob(db: MockDb, jobId: string): WorkflowJob | null {
  const job = db.jobs.find((entry) => entry.id === jobId);
  if (!job) return null;
  const workflow = db.workflowCatalog.find((entry) => entry.id === job.workflowId);
  if (!workflow) return job;

  const elapsed = Date.now() - new Date(job.startedAt).getTime();
  const completedSteps = Math.min(job.totalSteps, Math.floor(elapsed / STEP_DURATION_MS));
  const isFinished = completedSteps >= job.totalSteps;
  const currentStep = isFinished ? job.totalSteps : Math.min(job.totalSteps, completedSteps + 1);

  const result: Record<string, string> = {};
  workflow.steps.slice(0, completedSteps).forEach((step, index) => {
    result[`step${index + 1}`] = stepMarkdown(workflow, step, index, job.projectName);
  });

  const logs = [
    `▶️ Execução iniciada para ${job.projectName}`,
    ...workflow.steps.map((step, index) => {
      if (index < completedSteps) return `✅ ${step.name} concluído`;
      if (index + 1 === currentStep && !isFinished) return `⏳ ${step.name} em andamento`;
      return `• ${step.name} pendente`;
    }),
  ];

  const nextJob: WorkflowJob = {
    ...job,
    currentStep,
    status: isFinished ? 'done' : 'running',
    result,
    logs,
    finishedAt: isFinished ? job.finishedAt ?? new Date(new Date(job.startedAt).getTime() + job.totalSteps * STEP_DURATION_MS).toISOString() : undefined,
  };

  const runSteps: RunStep[] = workflow.steps.map((step, index) => ({
    id: `${job.id}-run-step-${index + 1}`,
    workflowStepId: `step${index + 1}`,
    workflowStep: { type: step.agent.includes('+') ? 'parallel' : 'llm' },
    status: index < completedSteps ? 'completed' : index + 1 === currentStep && !isFinished ? 'running' : 'pending',
    input: index === 0 ? { projectName: job.projectName } : { previousStep: `step${index}` },
    output: index < completedSteps ? { markdown: result[`step${index + 1}`] } : null,
    durationMs: index < completedSteps ? STEP_DURATION_MS : null,
    logs: [logs[index + 1] ?? ''],
    createdAt: job.startedAt,
  }));

  const run: Run = {
    id: job.id,
    workflowId: workflow.id,
    workflow: { id: workflow.id, name: workflow.name, version: 'mock-1.0.0' },
    status: isFinished ? 'completed' : 'running',
    input: { projectName: job.projectName },
    output: isFinished ? {
      reportTitle: `${workflow.name} — ${job.projectName}`,
      reportSummary: `Execução mock concluída com ${job.totalSteps} passo(s).`,
      recommendation: 'Validar a navegação e os estados visuais com o backend real quando disponível.',
      confidence: 0.88,
      observability: {
        reasoning: 'Resultado gerado pelo modo frontend-only mock para permitir testes completos sem backend.',
        confidence: 0.88,
        alternatives: ['Executar com backend real', 'Executar em ambiente de homologação'],
      },
    } : null,
    createdAt: job.startedAt,
    updatedAt: nextJob.finishedAt ?? new Date().toISOString(),
    steps: runSteps,
  };

  const existingRunIndex = db.runs.findIndex((entry) => entry.id === run.id);
  if (existingRunIndex >= 0) db.runs[existingRunIndex] = run;
  else db.runs.push(run);

  const existingIndex = db.jobs.findIndex((entry) => entry.id === nextJob.id);
  db.jobs[existingIndex] = nextJob;
  return nextJob;
}

function materializeAllJobs(db: MockDb): WorkflowJob[] {
  return db.jobs.map((job) => materializeJob(db, job.id) ?? job);
}

function seedJobs(workflows: WorkflowCatalogEntry[]): WorkflowJob[] {
  const current = new Date();
  const finishedStart = new Date(current.getTime() - 30 * 60 * 1000).toISOString();
  const runningStart = new Date(current.getTime() - 2 * STEP_DURATION_MS).toISOString();
  return [
    {
      id: 'job-demo-finished',
      workflowId: workflows[0].id,
      workflowName: workflows[0].name,
      status: 'done',
      currentStep: workflows[0].steps.length,
      totalSteps: workflows[0].steps.length,
      projectName: 'Governança 360',
      logs: [],
      result: {},
      startedAt: finishedStart,
      finishedAt: new Date(new Date(finishedStart).getTime() + workflows[0].steps.length * STEP_DURATION_MS).toISOString(),
    },
    {
      id: 'job-demo-running',
      workflowId: workflows[1].id,
      workflowName: workflows[1].name,
      status: 'running',
      currentStep: 1,
      totalSteps: workflows[1].steps.length,
      projectName: 'Análise Contratual XPTO',
      logs: [],
      startedAt: runningStart,
    },
  ];
}

function createInitialDb(): MockDb {
  const specs = seedSpecs();
  const managedAgents = seedManagedAgents();
  const catalogAgents = managedAgents.map(managedToCatalogAgent);
  const managedWorkflows = seedManagedWorkflows();
  const workflowCatalog = seedWorkflowCatalog();
  const jobs = seedJobs(workflowCatalog);
  const db: MockDb = {
    specs,
    managedAgents,
    catalogAgents,
    managedWorkflows,
    workflowCatalog,
    jobs,
    runs: [],
    logs: [],
    config: {
      mockMode: true,
      availableModels: {
        anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5'],
        openai: ['gpt-4o', 'gpt-4o-mini'],
      },
    },
  };

  materializeAllJobs(db);
  return db;
}

function readDb(): MockDb {
  if (typeof window === 'undefined') return createInitialDb();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createInitialDb();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as MockDb;
  } catch {
    const seeded = createInitialDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeDb(db: MockDb): MockDb {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
  return db;
}

function withDb<T>(fn: (db: MockDb) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return clone(result);
}

export const mockApi = {
  agents: {
    list: async (): Promise<Agent[]> => withDb((db) => db.catalogAgents),
    get: async (id: string): Promise<Agent> => withDb((db) => {
      const found = db.catalogAgents.find((agent) => agent.id === id);
      if (!found) throw new Error('Agente não encontrado.');
      return found;
    }),
  },
  chat: {
    send: async (params: {
      agentId: string;
      message: string;
      history: ChatMessage[];
      mode: string;
      provider: string;
      model: string;
    }): Promise<ChatMessage> => withDb((db) => {
      const agent = db.catalogAgents.find((entry) => entry.id === params.agentId);
      return {
        id: randomId('chat'),
        role: 'assistant',
        agentId: params.agentId,
        timestamp: nowIso(),
        content: [
          `Resposta mock do agente ${agent?.name ?? params.agentId}.`,
          '',
          `Modo: ${params.mode} · Provedor: ${params.provider} · Modelo: ${params.model}`,
          '',
          `Resumo da solicitação: ${params.message}`,
          '',
          'Este retorno existe para permitir testes do frontend sem backend.',
        ].join('\n'),
        tokens: { input: Math.max(12, params.message.length), output: 96 },
      };
    }),
  },
  workflow: {
    getCatalog: async (): Promise<WorkflowCatalogEntry[]> => withDb((db) => db.workflowCatalog),
    getWorkflow: async (id: string): Promise<WorkflowCatalogEntry> => withDb((db) => {
      const found = db.workflowCatalog.find((workflow) => workflow.id === id);
      if (!found) throw new Error('Workflow não encontrado.');
      return found;
    }),
    createWorkflow: async (workflow: WorkflowCatalogEntry): Promise<WorkflowCatalogEntry> => withDb((db) => {
      const created = {
        ...workflow,
        id: workflow.id || randomId('catalog-workflow'),
      };
      db.workflowCatalog.push(created);
      return created;
    }),
    updateWorkflow: async (id: string, workflow: WorkflowCatalogEntry): Promise<WorkflowCatalogEntry> => withDb((db) => {
      const index = db.workflowCatalog.findIndex((entry) => entry.id === id);
      if (index < 0) throw new Error('Workflow não encontrado para atualização.');
      db.workflowCatalog[index] = { ...workflow, id };
      return db.workflowCatalog[index];
    }),
    run: async (params: {
      workflowId: string;
      projectName: string;
      inputs: Record<string, string>;
      agentFields?: Record<string, Record<string, unknown>>;
      startFromStep?: number;
    }): Promise<{ jobId: string; workflowName: string; totalSteps: number }> => withDb((db) => {
      const workflow = db.workflowCatalog.find((entry) => entry.id === params.workflowId);
      if (!workflow) throw new Error('Workflow não encontrado para execução.');
      const jobId = randomId('job');
      db.jobs.unshift({
        id: jobId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: 'running',
        currentStep: params.startFromStep ?? 1,
        totalSteps: workflow.steps.length,
        projectName: params.projectName,
        logs: ['▶️ Execução mock iniciada'],
        result: {},
        startedAt: nowIso(),
      });
      materializeJob(db, jobId);
      return { jobId, workflowName: workflow.name, totalSteps: workflow.steps.length };
    }),
    getJob: async (jobId: string): Promise<WorkflowJob> => withDb((db) => {
      const materialized = materializeJob(db, jobId);
      if (!materialized) throw new Error('Job não encontrado.');
      return materialized;
    }),
    getAllJobs: async (workflowId?: string): Promise<WorkflowJob[]> => withDb((db) => {
      const jobs = materializeAllJobs(db);
      return workflowId ? jobs.filter((job) => job.workflowId === workflowId) : jobs;
    }),
  },
  config: {
    get: async (): Promise<AppConfig & { mockMode: boolean }> => withDb((db) => db.config),
    health: async (): Promise<{ status: string; mockMode: boolean }> => ({
      status: 'ok',
      mockMode: true,
    }),
  },
  specs: {
    list: async (): Promise<Spec[]> => withDb((db) => db.specs),
    get: async (id: string): Promise<Spec> => withDb((db) => {
      const found = db.specs.find((spec) => spec.id === id);
      if (!found) throw new Error('Spec não encontrada.');
      return found;
    }),
    create: async (payload: { name: string; description?: string; content: string; version: string }): Promise<Spec> => withDb((db) => {
      const created: Spec = {
        id: randomId('spec'),
        name: payload.name,
        description: payload.description ?? null,
        content: payload.content,
        version: payload.version,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.specs.unshift(created);
      return created;
    }),
    update: async (id: string, payload: Partial<{ name: string; description: string; content: string; version: string }>): Promise<Spec> => withDb((db) => {
      const index = db.specs.findIndex((spec) => spec.id === id);
      if (index < 0) throw new Error('Spec não encontrada para atualização.');
      const current = db.specs[index];
      db.specs[index] = {
        ...current,
        ...payload,
        description: payload.description ?? current.description,
        updatedAt: nowIso(),
      };
      return db.specs[index];
    }),
    delete: async (id: string): Promise<void> => withDb((db) => {
      db.specs = db.specs.filter((spec) => spec.id !== id);
    }),
  },
  managedAgents: {
    list: async (): Promise<ManagedAgent[]> => withDb((db) => db.managedAgents),
    get: async (id: string): Promise<ManagedAgent> => withDb((db) => {
      const found = db.managedAgents.find((agent) => agent.id === id);
      if (!found) throw new Error('Agente gerenciado não encontrado.');
      return found;
    }),
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
      inputFields?: ManagedAgent['inputFields'];
      outputBlocks?: ManagedAgent['outputBlocks'];
      methodRules?: ManagedAgent['methodRules'];
    }): Promise<ManagedAgent> => withDb((db) => {
      const created: ManagedAgent = {
        id: randomId('agent'),
        name: payload.name,
        description: payload.description ?? null,
        specId: payload.specId,
        spec: db.specs.find((spec) => spec.id === payload.specId) ? { id: payload.specId, name: db.specs.find((spec) => spec.id === payload.specId)!.name } : undefined,
        promptTemplate: payload.promptTemplate,
        inputSchema: payload.inputSchema ?? null,
        outputSchema: payload.outputSchema ?? null,
        executionSteps: payload.executionSteps,
        contextSources: payload.contextSources,
        status: payload.status ?? 'active',
        inputFields: payload.inputFields ?? [],
        outputBlocks: payload.outputBlocks ?? [],
        methodRules: payload.methodRules ?? [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.managedAgents.unshift(created);
      db.catalogAgents.unshift(managedToCatalogAgent(created));
      return created;
    }),
    update: async (id: string, payload: Partial<{
      name: string;
      description: string;
      specId: string;
      promptTemplate: string;
      executionSteps: unknown;
      contextSources: unknown;
      inputFields: ManagedAgent['inputFields'];
      outputBlocks: ManagedAgent['outputBlocks'];
      methodRules: ManagedAgent['methodRules'];
    }>): Promise<ManagedAgent> => withDb((db) => {
      const index = db.managedAgents.findIndex((agent) => agent.id === id);
      if (index < 0) throw new Error('Agente gerenciado não encontrado para atualização.');
      const current = db.managedAgents[index];
      const updated: ManagedAgent = {
        ...current,
        ...payload,
        description: payload.description ?? current.description,
        specId: payload.specId ?? current.specId,
        spec: (payload.specId ?? current.specId)
          ? (() => {
              const spec = db.specs.find((entry) => entry.id === (payload.specId ?? current.specId));
              return spec ? { id: spec.id, name: spec.name } : current.spec;
            })()
          : current.spec,
        updatedAt: nowIso(),
      };
      db.managedAgents[index] = updated;
      const catalogIndex = db.catalogAgents.findIndex((agent) => agent.id === id);
      if (catalogIndex >= 0) {
        db.catalogAgents[catalogIndex] = managedToCatalogAgent(updated);
      }
      return updated;
    }),
    delete: async (id: string): Promise<void> => withDb((db) => {
      db.managedAgents = db.managedAgents.filter((agent) => agent.id !== id);
      db.catalogAgents = db.catalogAgents.filter((agent) => agent.id !== id);
    }),
  },
  managedWorkflows: {
    list: async (): Promise<ManagedWorkflow[]> => withDb((db) => db.managedWorkflows),
    get: async (id: string): Promise<ManagedWorkflow> => withDb((db) => {
      const found = db.managedWorkflows.find((workflow) => workflow.id === id);
      if (!found) throw new Error('Workflow gerenciado não encontrado.');
      return found;
    }),
    create: async (payload: {
      name: string;
      version: string;
      steps: { order: number; type: string; config: WorkflowStepConfig }[];
    }): Promise<ManagedWorkflow> => withDb((db) => {
      const created: ManagedWorkflow = {
        id: randomId('managed-workflow'),
        name: payload.name,
        version: payload.version,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        steps: payload.steps,
      };
      db.managedWorkflows.unshift(created);
      return created;
    }),
    update: async (id: string, payload: Partial<{
      name: string;
      version: string;
      steps: { order: number; type: string; config: WorkflowStepConfig }[];
    }>): Promise<ManagedWorkflow> => withDb((db) => {
      const index = db.managedWorkflows.findIndex((workflow) => workflow.id === id);
      if (index < 0) throw new Error('Workflow gerenciado não encontrado para atualização.');
      db.managedWorkflows[index] = {
        ...db.managedWorkflows[index],
        ...payload,
        updatedAt: nowIso(),
      };
      return db.managedWorkflows[index];
    }),
    delete: async (id: string): Promise<void> => withDb((db) => {
      db.managedWorkflows = db.managedWorkflows.filter((workflow) => workflow.id !== id);
    }),
  },
  runs: {
    list: async (limit?: number): Promise<Run[]> => withDb((db) => {
      materializeAllJobs(db);
      return limit != null ? db.runs.slice(0, limit) : db.runs;
    }),
    get: async (id: string): Promise<Run> => withDb((db) => {
      materializeJob(db, id);
      const found = db.runs.find((run) => run.id === id);
      if (!found) throw new Error('Run não encontrado.');
      return found;
    }),
    start: async (workflowId: string, input: Record<string, unknown> = {}): Promise<{ runId: string }> => withDb((db) => {
      const workflow = db.workflowCatalog.find((entry) => entry.id === workflowId);
      if (!workflow) throw new Error('Workflow não encontrado.');
      const projectName = typeof input.projectName === 'string' ? input.projectName : `Projeto ${workflow.name}`;
      const jobId = randomId('job');
      db.jobs.unshift({
        id: jobId,
        workflowId,
        workflowName: workflow.name,
        status: 'running',
        currentStep: 1,
        totalSteps: workflow.steps.length,
        projectName,
        logs: ['▶️ Run mock iniciado'],
        result: {},
        startedAt: nowIso(),
      });
      materializeJob(db, jobId);
      return { runId: jobId };
    }),
  },
  observability: {
    getLogs: async (params?: {
      executionId?: string;
      level?: ObservabilityLogLevel | 'all';
      search?: string;
      limit?: number;
    }): Promise<ObservabilityLog[]> => withDb((db) => {
      materializeAllJobs(db);
      const generatedLogs: ObservabilityLog[] = db.jobs.flatMap((job) => {
        const workflow = db.workflowCatalog.find((entry) => entry.id === job.workflowId);
        return (workflow?.steps ?? []).map((step, index) => {
          const level: ObservabilityLogLevel = index + 1 < job.currentStep ? 'decision' : job.status === 'error' ? 'error' : index + 1 === job.currentStep ? 'info' : 'debug';
          return {
            id: `${job.id}-log-${index + 1}`,
            timestamp: new Date(new Date(job.startedAt).getTime() + index * STEP_DURATION_MS).toISOString(),
            level,
            source: 'frontend-mock',
            agent: step.agent,
            executionId: job.id,
            message: level === 'decision' ? `${step.name} finalizado com sucesso.` : level === 'info' ? `${step.name} em andamento.` : `${step.name} aguardando execução.`,
            details: level === 'debug' ? 'Log gerado pelo mock de frontend.' : undefined,
            stepName: step.name,
            decision: level === 'decision' ? {
              reasoning: `O passo ${step.name} foi concluído no mock com saída estruturada para teste visual.`,
              confidence: 0.84,
              alternatives: ['Executar com backend real', 'Refinar o prompt do agente'],
            } : null,
          };
        });
      });

      let filtered = generatedLogs;
      if (params?.executionId) filtered = filtered.filter((log) => log.executionId === params.executionId);
      if (params?.level && params.level !== 'all') filtered = filtered.filter((log) => log.level === params.level);
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filtered = filtered.filter((log) =>
          log.message.toLowerCase().includes(searchTerm)
          || log.agent.toLowerCase().includes(searchTerm)
          || (log.stepName ?? '').toLowerCase().includes(searchTerm),
        );
      }
      return params?.limit != null ? filtered.slice(0, params.limit) : filtered;
    }),
    getStats: async (): Promise<ObservabilityStats> => withDb((db) => {
      const logs = db.jobs.flatMap((job) => job.logs);
      const materialized = logs.length > 0 ? logs : ['info', 'decision', 'warn'];
      return {
        total: materialized.length * Math.max(1, db.jobs.length),
        decisions: db.jobs.length * 2,
        warnings: db.jobs.length,
        errors: db.jobs.filter((job) => job.status === 'error').length,
      };
    }),
  },
};
