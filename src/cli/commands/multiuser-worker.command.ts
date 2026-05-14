import type { Command } from '@commander-js/extra-typings';
import { createLocalStorySpecRunner } from '../../server/agent-runtime/local-storyspec-runner.js';
import { createOpenHandsRunner } from '../../server/agent-runtime/openhands-runner.js';
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
  runWorker?: (input: RunNextAgentJobInput) => Promise<RunNextAgentJobResult>;
  waitForShutdown?: () => Promise<void>;
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

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const createWorkerRuntimes = () => [
  createLocalStorySpecRunner(),
  createOpenHandsRunner({
    workspaceRoot: process.cwd()
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

      try {
        const workerInput: RunNextAgentJobInput = {
          repository: databaseConnection.repositories.jobs,
          queue,
          runtimes: createWorkerRuntimes()
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
