import type { Command } from '@commander-js/extra-typings';
import { createLocalStorySpecRunner } from '../../server/agent-runtime/local-storyspec-runner.js';
import {
  createOpenHandsHeadlessExecutor,
  createOpenHandsRunner
} from '../../server/agent-runtime/openhands-runner.js';
import type { AgentRuntimeAdapter } from '../../server/agent-runtime/agent-runtime.js';
import { createPostgresDatabaseConnection } from '../../server/db/postgres.js';
import type { PostgresDatabaseConnection } from '../../server/db/postgres.js';
import { createBullMqAgentJobQueue } from '../../server/queue/bullmq-agent-job-queue.js';
import type { BullMqAgentJobQueueInput } from '../../server/queue/bullmq-agent-job-queue.js';
import type { AgentJobQueue } from '../../server/queue/agent-job-queue.js';
import { runNextAgentJob } from '../../server/workers/agent-job-worker.js';
import type { RunNextAgentJobInput, RunNextAgentJobResult } from '../../server/workers/agent-job-worker.js';

export interface MultiuserWorkerCommandDependencies {
  env?: NodeJS.ProcessEnv;
  createDatabaseConnection?: typeof createPostgresDatabaseConnection;
  createQueue?: (input: BullMqAgentJobQueueInput) => AgentJobQueue;
  createRuntimes?: (input: WorkerRuntimeConfig) => AgentRuntimeAdapter[];
  runWorker?: (input: RunNextAgentJobInput) => Promise<RunNextAgentJobResult>;
  waitForShutdown?: () => Promise<void>;
}

export interface WorkerRuntimeConfig {
  workspaceRoot: string;
  openHandsHeadless: boolean;
  openHandsCommand?: string;
  openHandsPromptPrefix?: string;
}

const waitForShutdownSignal = (): Promise<void> => new Promise(resolve => {
  const stop = () => {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    resolve();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
});

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return value !== 'false';
};

const parseExplicitTrue = (value: string | undefined): boolean => value?.trim() === 'true';

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const trimOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const createWorkerRuntimes = (
  input: WorkerRuntimeConfig
): AgentRuntimeAdapter[] => [
  createLocalStorySpecRunner(),
  createOpenHandsRunner({
    workspaceRoot: input.workspaceRoot,
    command: input.openHandsCommand,
    promptPrefix: input.openHandsPromptPrefix,
    executor: input.openHandsHeadless
      ? createOpenHandsHeadlessExecutor()
      : undefined
  })
];

export const registerMultiuserWorkerCommand = (
  program: Command,
  dependencies: MultiuserWorkerCommandDependencies = {}
): void => {
  program
    .command('worker')
    .description('运行多用户 agent job worker')
    .option('--once', '只处理一个 job 后退出')
    .action(async options => {
      const env = dependencies.env ?? process.env;
      const databaseUrl = env.STORYSPEC_DATABASE_URL?.trim();
      const redisUrl = env.STORYSPEC_REDIS_URL?.trim();
      const once = Boolean(options.once) || parseBoolean(env.STORYSPEC_WORKER_ONCE, false);
      const concurrency = parsePositiveInteger(env.STORYSPEC_WORKER_CONCURRENCY, 1);

      if (!databaseUrl) {
        throw new Error('storyspec worker 需要 STORYSPEC_DATABASE_URL');
      }
      if (!redisUrl) {
        throw new Error('storyspec worker 需要 STORYSPEC_REDIS_URL');
      }

      const databaseConnection: PostgresDatabaseConnection = await (
        dependencies.createDatabaseConnection ?? createPostgresDatabaseConnection
      )({
        connectionString: databaseUrl,
        migrate: parseBoolean(env.STORYSPEC_DATABASE_MIGRATE, true)
      });
      const queue = (dependencies.createQueue ?? createBullMqAgentJobQueue)({
        redisUrl,
        concurrency
      });
      const runWorker = dependencies.runWorker ?? runNextAgentJob;
      const runtimeConfig: WorkerRuntimeConfig = {
        workspaceRoot: process.cwd(),
        openHandsHeadless: parseExplicitTrue(env.STORYSPEC_OPENHANDS_HEADLESS),
        openHandsCommand: trimOptional(env.STORYSPEC_OPENHANDS_COMMAND),
        openHandsPromptPrefix: trimOptional(env.STORYSPEC_OPENHANDS_PROMPT_PREFIX)
      };
      const runtimes = (dependencies.createRuntimes ?? createWorkerRuntimes)(runtimeConfig);

      try {
        const workerInput: RunNextAgentJobInput = {
          repository: databaseConnection.repositories.jobs,
          queue,
          runtimes
        };

        if (once) {
          await runWorker(workerInput);
          return;
        }

        for (;;) {
          const result = await runWorker(workerInput);
          if (!result.processed) {
            await (dependencies.waitForShutdown ?? waitForShutdownSignal)();
            return;
          }
        }
      } finally {
        await queue.close();
        await databaseConnection.close();
      }
    });
};
