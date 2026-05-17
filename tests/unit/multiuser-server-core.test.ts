import { describe, expect, it } from 'vitest';
import {
  createErrorResponse,
  createRequestContext,
  createServerHealth
} from '../../src/server/http/server-core.js';

describe('multiuser server core', () => {
  it('creates stable health metadata', () => {
    expect(createServerHealth({
      version: '0.20.0',
      now: () => '2026-05-08T12:00:00.000Z'
    })).toEqual({
      service: 'storyspec-multiuser',
      status: 'ok',
      version: '0.20.0',
      checkedAt: '2026-05-08T12:00:00.000Z'
    });
  });

  it('preserves incoming request id or generates one', () => {
    expect(createRequestContext({
      requestId: 'req-existing'
    })).toEqual({
      requestId: 'req-existing'
    });

    expect(createRequestContext({
      now: () => '2026-05-08T12:00:00.000Z',
      random: () => 'abc123'
    })).toEqual({
      requestId: 'req-2026-05-08T12-00-00-000Z-abc123'
    });
  });

  it('creates standard error responses with request id', () => {
    expect(createErrorResponse({
      statusCode: 403,
      requestId: 'req-existing',
      code: 'PROJECT_ACCESS_DENIED',
      message: '用户无权访问该项目',
      traceId: 'trace-project-1'
    })).toEqual({
      statusCode: 403,
      requestId: 'req-existing',
      traceId: 'trace-project-1',
      error: {
        code: 'PROJECT_ACCESS_DENIED',
        message: '用户无权访问该项目'
      }
    });
  });

  it('keeps contract details on error responses', () => {
    expect(createErrorResponse({
      statusCode: 409,
      requestId: 'req-conflict',
      code: 'RESOURCE_CONFLICT',
      message: '存在待解决的正典冲突',
      details: {
        storyId: 'story-1',
        resourceVersion: 'rv-story-1'
      }
    })).toEqual({
      statusCode: 409,
      requestId: 'req-conflict',
      error: {
        code: 'RESOURCE_CONFLICT',
        message: '存在待解决的正典冲突',
        details: {
          storyId: 'story-1',
          resourceVersion: 'rv-story-1'
        }
      }
    });
  });
});
