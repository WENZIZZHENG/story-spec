export interface ServerHealthInput {
  version: string;
  now?: () => string;
  service?: string;
}

export interface ServerHealth {
  service: string;
  status: 'ok';
  version: string;
  checkedAt: string;
}

export interface RequestContextInput {
  requestId?: string;
  now?: () => string;
  random?: () => string;
}

export interface RequestContext {
  requestId: string;
}

export interface ErrorResponseInput {
  statusCode: number;
  requestId: string;
  code: string;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  requestId: string;
  error: {
    code: string;
    message: string;
  };
}

const currentTimestamp = (): string => new Date().toISOString();

const defaultRandom = (): string => Math.random().toString(36).slice(2, 10);

const sanitizeRequestIdPart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const createServerHealth = (input: ServerHealthInput): ServerHealth => ({
  service: input.service ?? 'storyspec-multiuser',
  status: 'ok',
  version: input.version,
  checkedAt: input.now?.() ?? currentTimestamp()
});

export const createRequestContext = (input: RequestContextInput = {}): RequestContext => {
  const incoming = input.requestId?.trim();
  if (incoming) {
    return { requestId: incoming };
  }

  const timestamp = sanitizeRequestIdPart(input.now?.() ?? currentTimestamp());
  const random = sanitizeRequestIdPart(input.random?.() ?? defaultRandom());
  return {
    requestId: `req-${timestamp}-${random}`
  };
};

export const createErrorResponse = (input: ErrorResponseInput): ErrorResponse => ({
  statusCode: input.statusCode,
  requestId: input.requestId,
  error: {
    code: input.code,
    message: input.message
  }
});
