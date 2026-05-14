import type { AgentJob } from '../jobs/agent-job.js';

export interface AgentJobQueuePayload {
  jobId: string;
  projectId: string;
  userId: string;
  runtime: string;
  kind: string;
  attempt: number;
  traceId?: string;
}

export interface QueueReadyState {
  configured: boolean;
  connected: boolean;
  worker: boolean;
  driver: 'memory' | 'bullmq' | 'none';
}

export interface AgentJobQueueItem {
  payload: AgentJobQueuePayload;
}

export interface AgentJobQueue {
  enqueue(payload: AgentJobQueuePayload): Promise<void>;
  dequeue(): Promise<AgentJobQueueItem | undefined>;
  ack(item: AgentJobQueueItem): Promise<void>;
  fail(item: AgentJobQueueItem, reason: string): Promise<void>;
  getReadyState(): QueueReadyState;
  close(): Promise<void>;
}

export interface MemoryAgentJobQueueSnapshot {
  pending: AgentJobQueuePayload[];
  acknowledged: string[];
  failed: Array<{
    jobId: string;
    reason: string;
  }>;
}

export interface MemoryAgentJobQueue extends AgentJobQueue {
  snapshot(): MemoryAgentJobQueueSnapshot;
}

export const createAgentJobQueuePayload = (job: AgentJob): AgentJobQueuePayload => ({
  jobId: job.id,
  projectId: job.projectId,
  userId: job.userId,
  runtime: job.runtime,
  kind: job.kind,
  attempt: job.attempt,
  traceId: job.traceId
});

export const createMemoryAgentJobQueue = (): MemoryAgentJobQueue => {
  const pending: AgentJobQueuePayload[] = [];
  const acknowledged: string[] = [];
  const failed: Array<{ jobId: string; reason: string }> = [];

  return {
    async enqueue(payload) {
      pending.push(payload);
    },
    async dequeue() {
      const payload = pending.shift();
      return payload ? { payload } : undefined;
    },
    async ack(item) {
      acknowledged.push(item.payload.jobId);
    },
    async fail(item, reason) {
      failed.push({
        jobId: item.payload.jobId,
        reason
      });
    },
    getReadyState() {
      return {
        configured: true,
        connected: true,
        worker: true,
        driver: 'memory'
      };
    },
    async close() {
      return;
    },
    snapshot() {
      return {
        pending: [...pending],
        acknowledged: [...acknowledged],
        failed: [...failed]
      };
    }
  };
};

export const unconfiguredQueueReadyState = (): QueueReadyState => ({
  configured: false,
  connected: false,
  worker: false,
  driver: 'none'
});
