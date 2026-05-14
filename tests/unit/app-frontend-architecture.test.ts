import { describe, expect, it } from 'vitest';
import {
  buildCompleteAppFrontendArchitecture
} from '../../src/app-server/app-frontend-architecture.js';

describe('complete app frontend architecture', () => {
  it('defines first-slice routes for the complete App shell', () => {
    const architecture = buildCompleteAppFrontendArchitecture();

    expect(architecture.routes.map(route => route.id)).toEqual([
      'project-workspace',
      'story-cockpit',
      'chapter-writing',
      'canon-review',
      'task-center'
    ]);
    expect(architecture.routes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'story-cockpit',
        label: '故事驾驶舱',
        route: '#story-cockpit',
        purpose: expect.stringContaining('当前故事卡在哪里'),
        emptyState: expect.stringContaining('打开或创建项目')
      }),
      expect.objectContaining({
        id: 'chapter-writing',
        label: '章节与写作',
        requiredPermission: '可以查看章节写作入口；发布仍需作者确认。'
      }),
      expect.objectContaining({
        id: 'canon-review',
        label: '候选与正典审阅',
        purpose: expect.stringContaining('候选')
      })
    ]));
  });

  it('centralizes local App API endpoints and token header', () => {
    const architecture = buildCompleteAppFrontendArchitecture();

    expect(architecture.apiClient.tokenHeader).toBe('x-storyspec-app-token');
    expect(architecture.apiClient.endpoints).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'current-app-state',
        method: 'GET',
        path: '/api/projects/current/app-state',
        routeId: 'story-cockpit',
        boundary: 'read-only'
      }),
      expect.objectContaining({
        id: 'story-ingest',
        method: 'POST',
        path: '/api/stories/ingest',
        routeId: 'story-cockpit',
        boundary: 'preview'
      }),
      expect.objectContaining({
        id: 'outline-promote',
        method: 'POST',
        path: '/api/outlines/promote',
        routeId: 'canon-review',
        boundary: 'dry-run'
      }),
      expect.objectContaining({
        id: 'chapter-draft-promote',
        method: 'POST',
        path: '/api/chapters/drafts/promote',
        routeId: 'chapter-writing',
        boundary: 'dry-run'
      })
    ]));
    expect(architecture.apiClient.endpoints.map(endpoint => endpoint.id)).toContain('chapter-review');
    expect(architecture.apiClient.endpoints.map(endpoint => endpoint.id)).toContain('task-board');
  });

  it('keeps user-facing state language and product boundaries explicit', () => {
    const architecture = buildCompleteAppFrontendArchitecture();

    expect(architecture.stateLanguage.errorStates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'unauthorized',
        label: '会话已失效',
        nextAction: expect.stringContaining('重新启动')
      }),
      expect.objectContaining({
        id: 'forbidden',
        label: '权限不足',
        nextAction: expect.stringContaining('成员权限')
      }),
      expect.objectContaining({
        id: 'blocked',
        label: '暂时无法继续'
      })
    ]));
    expect(architecture.writeBoundary).toEqual(expect.arrayContaining([
      '候选方案不会自动写入正式故事。',
      '预览和 dry-run 只展示影响，应用到正式故事必须经过作者确认。',
      'Agent 任务输出保持 preview-only，不能直接覆盖正文或正典。'
    ]));
    expect(architecture.implementationBoundary).toContain('本切片不包含富文本编辑器或实时协作。');
  });
});
