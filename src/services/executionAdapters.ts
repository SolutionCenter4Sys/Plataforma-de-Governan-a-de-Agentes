import { ExecutionDetail, ExecutionStatus, ExecutionStep, Run, WorkflowJob } from '../types';

function mapJobStatus(status: WorkflowJob['status']): ExecutionStatus {
  if (status === 'done') return 'succeeded';
  if (status === 'error') return 'failed';
  return status;
}

function mapRunStatus(status: string): ExecutionStatus {
  if (status === 'completed' || status === 'done' || status === 'success' || status === 'succeeded') return 'succeeded';
  if (status === 'failed' || status === 'error') return 'failed';
  return status === 'running' ? 'running' : 'pending';
}

function getDurationMs(startedAt: string, finishedAt?: string): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  return Number.isNaN(start) || Number.isNaN(end) ? null : Math.max(0, end - start);
}

function markdownToOutput(markdown: string): Record<string, unknown> {
  return { markdown };
}

export function normalizeWorkflowJob(job: WorkflowJob): ExecutionDetail {
  const steps: ExecutionStep[] = Array.from({ length: job.totalSteps }, (_, idx) => {
    const key = `step${idx + 1}`;
    const markdown = job.result?.[key] ?? null;
    const status: ExecutionStatus =
      markdown != null
        ? 'succeeded'
        : job.status === 'error' && job.currentStep === idx + 1
          ? 'failed'
          : job.currentStep === idx + 1 && job.status === 'running'
            ? 'running'
            : job.currentStep > idx + 1
              ? 'succeeded'
              : 'pending';

    return {
      id: `${job.id}-${key}`,
      key,
      label: `Passo ${idx + 1}`,
      status,
      type: 'llm',
      input: null,
      output: markdown ? markdownToOutput(markdown) : null,
      markdown,
      durationMs: null,
      logs: [],
    };
  });

  return {
    id: job.id,
    source: 'job',
    workflowId: job.workflowId,
    workflowName: job.workflowName,
    projectName: job.projectName,
    status: mapJobStatus(job.status),
    currentStep: job.currentStep,
    totalSteps: job.totalSteps,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    durationMs: getDurationMs(job.startedAt, job.finishedAt),
    input: null,
    output: job.result ?? null,
    logs: job.logs ?? [],
    error: job.error,
    steps,
  };
}

export function normalizeRun(run: Run): ExecutionDetail {
  const steps: ExecutionStep[] = (run.steps ?? []).map((step, idx) => {
    const output = step.output ?? null;
    const markdown =
      typeof output?.markdown === 'string'
        ? output.markdown
        : null;

    return {
      id: step.id,
      key: step.workflowStepId || `step${idx + 1}`,
      label: `Passo ${idx + 1}`,
      status: mapRunStatus(step.status),
      type: step.workflowStep?.type ?? 'llm',
      input: step.input,
      output,
      markdown,
      durationMs: step.durationMs,
      logs: step.logs ?? [],
    };
  });

  return {
    id: run.id,
    source: 'run',
    workflowId: run.workflowId,
    workflowName: run.workflow?.name ?? run.workflowId,
    projectName: typeof run.input?.projectName === 'string' ? run.input.projectName : run.workflow?.name ?? run.workflowId,
    status: mapRunStatus(run.status),
    currentStep: steps.findIndex((step) => step.status === 'running') + 1 || steps.filter((step) => step.status === 'succeeded').length,
    totalSteps: steps.length,
    startedAt: run.createdAt,
    finishedAt: run.updatedAt,
    durationMs: getDurationMs(run.createdAt, run.updatedAt),
    input: run.input,
    output: run.output,
    logs: steps.flatMap((step) => step.logs),
    steps,
  };
}
