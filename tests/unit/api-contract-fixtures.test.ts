import { describe, expect, it } from 'vitest';
import successFixture from '../fixtures/api-contract/success.json' with { type: 'json' };
import emptyFixture from '../fixtures/api-contract/empty.json' with { type: 'json' };
import unauthorizedFixture from '../fixtures/api-contract/unauthorized.json' with { type: 'json' };
import forbiddenFixture from '../fixtures/api-contract/forbidden.json' with { type: 'json' };
import conflictFixture from '../fixtures/api-contract/conflict.json' with { type: 'json' };
import blockedFixture from '../fixtures/api-contract/blocked.json' with { type: 'json' };
import offlineFixture from '../fixtures/api-contract/offline.json' with { type: 'json' };

const fixtures = [
  successFixture,
  emptyFixture,
  unauthorizedFixture,
  forbiddenFixture,
  conflictFixture,
  blockedFixture,
  offlineFixture
];

describe('api contract fixtures', () => {
  it('covers the expected success and error states', () => {
    expect(fixtures.map(fixture => fixture.state)).toEqual([
      'success',
      'empty',
      'unauthorized',
      'forbidden',
      'conflict',
      'blocked',
      'offline'
    ]);
  });

  it('keeps success fixtures on the shared response envelope', () => {
    for (const fixture of [successFixture, emptyFixture]) {
      expect(fixture.response).toMatchObject({
        requestId: expect.any(String),
        data: expect.any(Object),
        permissions: expect.any(Array),
        resourceVersion: expect.any(String),
        warnings: expect.any(Array)
      });
      expect(fixture.response).not.toHaveProperty('error');
    }
  });

  it('keeps error fixtures on the shared error shape', () => {
    for (const fixture of [unauthorizedFixture, forbiddenFixture, conflictFixture, blockedFixture, offlineFixture]) {
      expect(fixture.response).toMatchObject({
        statusCode: expect.any(Number),
        requestId: expect.any(String),
        error: {
          code: expect.any(String),
          message: expect.any(String)
        }
      });
      expect(fixture.response).not.toHaveProperty('data');
    }
  });

  it('assigns each fixture to a first-batch page and stable resource version', () => {
    expect(successFixture.pageId).toBe('workspace-projects');
    expect(emptyFixture.pageId).toBe('task-center');
    expect(unauthorizedFixture.pageId).toBe('workspace-projects');
    expect(forbiddenFixture.pageId).toBe('story-cockpit');
    expect(conflictFixture.pageId).toBe('canon-review');
    expect(blockedFixture.pageId).toBe('chapter-writing');
    expect(offlineFixture.pageId).toBe('members-permissions');

    expect(successFixture.response.resourceVersion).toBe('rv-projects-1');
    expect(emptyFixture.response.resourceVersion).toBe('rv-task-center-empty');
  });
});
