export type QuotaScopeType = 'user' | 'project';
export type QuotaMetric = 'request' | 'job' | 'token';

export interface QuotaBucket {
  id: string;
  scopeType: QuotaScopeType;
  scopeId: string;
  metric: QuotaMetric;
  limit: number;
  used: number;
}

export interface QuotaRepository {
  findBucket(input: {
    scopeType: QuotaScopeType;
    scopeId: string;
    metric: QuotaMetric;
  }): Promise<QuotaBucket | undefined>;
  saveBucket(bucket: QuotaBucket): Promise<void>;
}

export interface MemoryQuotaRepositoryInput {
  buckets: QuotaBucket[];
}

export interface QuotaCheckInput {
  repository: QuotaRepository;
  scopeType: QuotaScopeType;
  scopeId: string;
  metric: QuotaMetric;
  amount: number;
}

export interface QuotaResult {
  blocked: boolean;
  blockedReasons: string[];
  bucket?: QuotaBucket;
}

const keyOf = (bucket: Pick<QuotaBucket, 'scopeType' | 'scopeId' | 'metric'>): string =>
  `${bucket.scopeType}:${bucket.scopeId}:${bucket.metric}`;

const blocked = (reason: string, bucket?: QuotaBucket): QuotaResult => ({
  blocked: true,
  blockedReasons: [reason],
  bucket
});

export const createMemoryQuotaRepository = (
  input: MemoryQuotaRepositoryInput
): QuotaRepository => {
  const buckets = new Map(input.buckets.map(bucket => [keyOf(bucket), bucket]));

  return {
    async findBucket(query) {
      return buckets.get(keyOf(query));
    },
    async saveBucket(bucket) {
      buckets.set(keyOf(bucket), bucket);
    }
  };
};

export const checkQuota = async (
  input: QuotaCheckInput
): Promise<QuotaResult> => {
  const bucket = await input.repository.findBucket(input);
  if (!bucket) {
    return {
      blocked: false,
      blockedReasons: []
    };
  }

  if (bucket.used + input.amount > bucket.limit) {
    return blocked(
      `配额不足：${bucket.metric} 已用 ${bucket.used}/${bucket.limit}，本次需要 ${input.amount}`,
      bucket
    );
  }

  return {
    blocked: false,
    blockedReasons: [],
    bucket
  };
};

export const consumeQuota = async (
  input: QuotaCheckInput
): Promise<QuotaResult> => {
  const checked = await checkQuota(input);
  if (checked.blocked || !checked.bucket) {
    return checked;
  }

  const bucket = {
    ...checked.bucket,
    used: checked.bucket.used + input.amount
  };
  await input.repository.saveBucket(bucket);

  return {
    blocked: false,
    blockedReasons: [],
    bucket
  };
};
