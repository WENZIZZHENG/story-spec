import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import { transitionAgentJob } from '../jobs/agent-job.js';

export interface AgentRuntimeOutput {
  jobId: string;
  candidateRef: string;
  previewOnly: true;
  summary: string;
  artifacts?: AgentRuntimeArtifact[];
  logs?: AgentRuntimeLogEntry[];
}

export type AgentRuntimeLogLevel = 'info' | 'warning' | 'error';

export interface AgentRuntimeArtifact {
  id: string;
  kind: string;
  label: string;
  previewText: string;
}

export interface AgentRuntimeLogEntry {
  level: AgentRuntimeLogLevel;
  message: string;
  createdAt?: string;
}

export interface AgentRuntimeOutputRecord {
  jobId: string;
  candidateRef: string;
  previewOnly: true;
  summary: string;
  artifacts: AgentRuntimeArtifact[];
  logs: Array<AgentRuntimeLogEntry & { createdAt: string }>;
  traceId?: string;
  createdAt: string;
}

export interface AgentRuntimeOutputRepository {
  save(record: AgentRuntimeOutputRecord): Promise<void>;
  listByJob(jobId: string): Promise<AgentRuntimeOutputRecord[]>;
  snapshot(): AgentRuntimeOutputRecord[];
}

export interface AgentRuntimeAdapter {
  readonly id: string;
  validate(job: AgentJob): Promise<string[]>;
  start(job: AgentJob): Promise<AgentRuntimeOutput>;
  cancel(job: AgentJob): Promise<void>;
  logs(job: AgentJob): AsyncIterable<string>;
  result(job: AgentJob): Promise<AgentRuntimeOutput | undefined>;
}

export interface RunAgentJobWithRuntimeInput {
  repository: AgentJobRepository;
  outputRepository?: AgentRuntimeOutputRepository;
  jobId: string;
  runtime: AgentRuntimeAdapter;
  now?: () => string;
}

export interface RunAgentJobWithRuntimeResult {
  blocked: boolean;
  blockedReasons: string[];
  job?: AgentJob;
  output?: AgentRuntimeOutput;
}

const blocked = (
  reason: string,
  job?: AgentJob
): RunAgentJobWithRuntimeResult => ({
  blocked: true,
  blockedReasons: [reason],
  job
});

export const createMemoryRuntimeOutputRepository = (): AgentRuntimeOutputRepository => {
  const records: AgentRuntimeOutputRecord[] = [];

  return {
    async save(record) {
      records.push({
        ...record,
        artifacts: record.artifacts.map(artifact => ({ ...artifact })),
        logs: record.logs.map(log => ({ ...log }))
      });
    },
    async listByJob(jobId) {
      return records
        .filter(record => record.jobId === jobId)
        .map(record => ({
          ...record,
          artifacts: record.artifacts.map(artifact => ({ ...artifact })),
          logs: record.logs.map(log => ({ ...log }))
        }));
    },
    snapshot() {
      return records.map(record => ({
        ...record,
        artifacts: record.artifacts.map(artifact => ({ ...artifact })),
        logs: record.logs.map(log => ({ ...log }))
      }));
    }
  };
};

const saveRuntimeOutput = async (
  input: RunAgentJobWithRuntimeInput,
  job: AgentJob,
  output: AgentRuntimeOutput
): Promise<void> => {
  if (!input.outputRepository) {
    return;
  }

  const createdAt = input.now?.() ?? new Date().toISOString();
  await input.outputRepository.save({
    jobId: output.jobId,
    candidateRef: output.candidateRef,
    previewOnly: true,
    summary: output.summary,
    artifacts: output.artifacts ?? [],
    logs: (output.logs ?? []).map(log => ({
      ...log,
      createdAt: log.createdAt ?? createdAt
    })),
    ...(job.traceId ? { traceId: job.traceId } : {}),
    createdAt
  });
};

export const runAgentJobWithRuntime = async (
  input: RunAgentJobWithRuntimeInput
): Promise<RunAgentJobWithRuntimeResult> => {
  const job = await input.repository.findById(input.jobId);
  if (!job) {
    return blocked('job 不存在');
  }

  const validationErrors = await input.runtime.validate(job);
  if (validationErrors.length > 0) {
    return blocked(validationErrors[0], job);
  }

  const running = await transitionAgentJob({
    repository: input.repository,
    jobId: job.id,
    status: 'running',
    now: input.now
  });
  if (running.blocked || !running.job) {
    return blocked(running.blockedReasons[0] ?? 'job 无法进入运行状态', running.job);
  }

  try {
    const output = await input.runtime.start(running.job);
    await saveRuntimeOutput(input, running.job, output);
    const succeeded = await transitionAgentJob({
      repository: input.repository,
      jobId: running.job.id,
      status: 'succeeded',
      now: input.now
    });

    return {
      blocked: false,
      blockedReasons: [],
      job: succeeded.job,
      output
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = await transitionAgentJob({
      repository: input.repository,
      jobId: running.job.id,
      status: 'failed',
      errorMessage: message,
      runtimeErrorCode: 'RUNTIME_EXECUTION_FAILED',
      now: input.now
    });

    return blocked(message, failed.job);
  }
};
