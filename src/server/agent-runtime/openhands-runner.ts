import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AgentJob } from '../jobs/agent-job.js';
import type { AgentRuntimeAdapter, AgentRuntimeArtifact, AgentRuntimeLogEntry, AgentRuntimeOutput } from './agent-runtime.js';

const execFileAsync = promisify(execFile);

export interface OpenHandsRunnerInput {
  workspaceRoot: string;
  command?: string;
  promptPrefix?: string;
  executor?: OpenHandsHeadlessExecutor;
}

export interface OpenHandsExecutionPlan {
  command: string;
  args: string[];
  workspaceRoot: string;
  task: string;
  autoApply: false;
}

export interface OpenHandsHeadlessExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type OpenHandsHeadlessExecutor = (
  plan: OpenHandsExecutionPlan
) => Promise<OpenHandsHeadlessExecutionResult>;

export interface OpenHandsRunner extends AgentRuntimeAdapter {
  plan(job: AgentJob): OpenHandsExecutionPlan;
}

const emptyLogs = async function* (): AsyncIterable<string> {
  return;
};

const compactOutput = (stdout: string, stderr: string): string => {
  const output = [stderr, stdout]
    .map(item => item.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 300);
  return output || 'OpenHands 未返回输出';
};

const streamPreview = (value: string): string => value.trim().slice(0, 1000);

const buildStreamArtifacts = (
  execution: OpenHandsHeadlessExecutionResult
): AgentRuntimeArtifact[] => {
  const streams: Array<{ id: string; kind: string; label: string; value: string }> = [
    {
      id: 'openhands-stdout',
      kind: 'stdout',
      label: 'OpenHands stdout',
      value: execution.stdout
    },
    {
      id: 'openhands-stderr',
      kind: 'stderr',
      label: 'OpenHands stderr',
      value: execution.stderr
    }
  ];

  return streams
    .map(stream => ({ ...stream, previewText: streamPreview(stream.value) }))
    .filter(stream => stream.previewText)
    .map(({ id, kind, label, previewText }) => ({
      id,
      kind,
      label,
      previewText
    }));
};

const buildStreamLogs = (
  artifacts: AgentRuntimeArtifact[]
): AgentRuntimeLogEntry[] => artifacts.map(artifact => ({
  level: artifact.kind === 'stderr' ? 'warning' : 'info',
  message: `${artifact.label}: ${artifact.previewText.slice(0, 300)}`
}));

export const createOpenHandsHeadlessExecutor = (): OpenHandsHeadlessExecutor => async plan => {
  try {
    const result = await execFileAsync(plan.command, plan.args, {
      cwd: plan.workspaceRoot,
      encoding: 'utf8'
    });

    return {
      exitCode: 0,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? ''
    };
  } catch (error) {
    const childError = error as {
      code?: number;
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      exitCode: typeof childError.code === 'number' ? childError.code : 1,
      stdout: childError.stdout ?? '',
      stderr: childError.stderr ?? childError.message ?? ''
    };
  }
};

export const createOpenHandsRunner = (
  input: OpenHandsRunnerInput
): OpenHandsRunner => {
  const command = input.command ?? 'openhands';
  const promptPrefix = input.promptPrefix ?? 'StorySpec job';
  let latestResult: AgentRuntimeOutput | undefined;

  return {
    id: 'openhands',
    plan(job) {
      const task = [
        `${promptPrefix}: ${job.kind} (${job.id})`,
        '输出只能作为候选，不能应用到正式故事、正典、tracking 或正文。',
        '请总结建议、风险和需要作者确认的下一步。'
      ].join('\n');

      return {
        command,
        args: [
          '--headless',
          '--workspace',
          input.workspaceRoot,
          '-t',
          task
        ],
        workspaceRoot: input.workspaceRoot,
        task,
        autoApply: false
      };
    },
    async validate(job) {
      return job.runtime === 'openhands'
        ? []
        : [`runtime 不匹配：${job.runtime}`];
    },
    async start(job) {
      const plan = this.plan(job);

      if (!input.executor) {
        latestResult = {
          jobId: job.id,
          candidateRef: `openhands:${job.id}`,
          previewOnly: true,
          summary: 'OpenHands PoC runtime 已生成候选'
        };
        return latestResult;
      }

      const execution = await input.executor(plan);
      if (execution.exitCode !== 0) {
        throw new Error(
          `OpenHands headless failed with exit code ${execution.exitCode}: ${compactOutput(execution.stdout, execution.stderr)}`
        );
      }

      latestResult = {
        jobId: job.id,
        candidateRef: `openhands:${job.id}`,
        previewOnly: true,
        summary: `OpenHands headless 已生成候选：${compactOutput(execution.stdout, execution.stderr)}`,
        artifacts: buildStreamArtifacts(execution)
      };
      latestResult = {
        ...latestResult,
        logs: buildStreamLogs(latestResult.artifacts ?? [])
      };
      return latestResult;
    },
    async cancel() {
      return;
    },
    logs: emptyLogs,
    async result() {
      return latestResult;
    }
  };
};
