import type { JobsOptions } from 'bullmq';
import { Queue, Worker } from 'bullmq';
import type {
  AgentJobQueue,
  AgentJobQueueItem,
  AgentJobQueuePayload,
  QueueReadyState
} from './agent-job-queue.js';

export interface RedisConnectionOptions {
  host: string;
  port: number;
  db?: number;
}

export interface BullMqQueueClient {
  add(name: string, data: AgentJobQueuePayload, options?: JobsOptions): Promise<unknown>;
  close(): Promise<void>;
}

export interface BullMqWorkerClient {
  close(): Promise<void>;
}

export interface BullMqAgentJobQueueInput {
  redisUrl: string;
  queueName?: string;
  concurrency?: number;
  clients?: {
    queue: BullMqQueueClient;
    worker?: BullMqWorkerClient;
  };
}

export interface BullMqAgentJobQueue extends AgentJobQueue {
  readonly queueName: string;
}

const DEFAULT_QUEUE_NAME = 'storyspec-agent-jobs';

interface BullMqAgentJobQueueItem extends AgentJobQueueItem {
  complete?: () => void;
  reject?: (reason: Error) => void;
}

type DequeueResolver = (item: BullMqAgentJobQueueItem | undefined) => void;

export const normalizeRedisConnection = (redisUrl: string): RedisConnectionOptions => {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number.parseInt(url.port, 10) : 6379,
    db: url.pathname && url.pathname !== '/'
      ? Number.parseInt(url.pathname.slice(1), 10)
      : undefined
  };
};

export const createBullMqAgentJobQueue = (
  input: BullMqAgentJobQueueInput
): BullMqAgentJobQueue => {
  const queueName = input.queueName ?? DEFAULT_QUEUE_NAME;
  const connection = normalizeRedisConnection(input.redisUrl);
  const queue = input.clients?.queue ?? new Queue<AgentJobQueuePayload>(queueName, {
    connection
  });
  const pending: BullMqAgentJobQueueItem[] = [];
  const dequeueResolvers: DequeueResolver[] = [];
  let closed = false;

  const deliver = (item: BullMqAgentJobQueueItem): void => {
    const resolve = dequeueResolvers.shift();
    if (resolve) {
      resolve(item);
      return;
    }
    pending.push(item);
  };

  const worker = input.clients?.worker ?? new Worker<AgentJobQueuePayload>(
    queueName,
    async job => new Promise<void>((resolve, reject) => {
      if (closed) {
        resolve();
        return;
      }
      deliver({
        payload: job.data,
        complete: resolve,
        reject
      });
    }),
    {
      concurrency: input.concurrency ?? 1,
      connection
    }
  );

  const readyState = (): QueueReadyState => ({
    configured: true,
    connected: true,
    worker: Boolean(worker),
    driver: 'bullmq'
  });

  return {
    queueName,
    async enqueue(payload) {
      await queue.add('agent-job', payload, {
        jobId: payload.jobId,
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false
      });
    },
    async dequeue(): Promise<AgentJobQueueItem | undefined> {
      const item = pending.shift();
      if (item || input.clients?.worker) {
        return item;
      }

      return new Promise(resolve => {
        dequeueResolvers.push(resolve);
      });
    },
    async ack(item) {
      (item as BullMqAgentJobQueueItem).complete?.();
    },
    async fail(item, reason) {
      (item as BullMqAgentJobQueueItem).reject?.(new Error(reason));
    },
    getReadyState: readyState,
    async close() {
      closed = true;
      for (const resolve of dequeueResolvers.splice(0)) {
        resolve(undefined);
      }
      await queue.close();
      await worker.close();
    }
  };
};
