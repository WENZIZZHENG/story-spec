# 完整 App 故事驾驶舱首批切片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已确认的“故事驾驶舱居中”设计落成第一批可验证实现：统一 App 状态契约、新的工作室控制台壳、故事驾驶舱入口、章节与写作、候选与正典、任务中心的首版导航和状态文案。

**Architecture:** 先不引入 React/Vite，沿用当前 `src/app-server` 的零依赖本机 HTML 服务，先把状态契约从巨大 HTML 字符串里抽出来。后端新增一个 typed App state endpoint，前端 shell 只消费该状态并展示首批页面入口；写入仍走现有 API，所有高影响动作保留 preview / confirm / apply。

**Tech Stack:** TypeScript ESM、Node HTTP server、Vitest、现有 `ProjectStatus` / local app server core / local app HTML shell。

---

## Scope

本计划实现完整 App 的第一批本机可用切片，不实现账号、云端数据库、真实多人实时协作、富文本编辑器、计费、公开社区或完整 SaaS。它会让 `storyspec app` 看起来和用起来更像完整 App，但文档与 UI 文案必须继续明确它当前仍是本机工作台。

## File Structure

- Create `src/app-server/app-state-contract.ts`
  负责完整 App 首版页面、状态语言、角色能力、驾驶舱摘要和空状态的 typed contract。它不读写文件，只把 `ProjectStatus` 映射成 UI 可消费状态。

- Modify `src/app-server/local-app-server.ts`
  新增 `getCurrentCompleteAppState()`，沿用 token 和 current project allowlist，内部复用 `projectStatus()` 和 `buildCompleteAppState()`。

- Modify `src/app-server/local-app-http-server.ts`
  新增 `GET /api/projects/current/app-state`，并保持缺 token / 未打开项目的错误边界。

- Modify `src/app-server/local-app-html.ts`
  重做首屏为“工作室控制台”：左导航、故事驾驶舱、中间主页面区域、右协作侧栏；继续保留现有打开/创建项目、创作入口、章节/任务/候选 API wiring。

- Create `tests/unit/app-state-contract.test.ts`
  覆盖 no project、empty project、story project、status language、role capability 和 preview/confirm/apply contract。

- Modify `tests/unit/local-app-server.test.ts`
  覆盖 core 新方法 token、未打开项目、打开项目后的状态。

- Modify `tests/unit/local-app-http-server.test.ts`
  覆盖新 endpoint。

- Modify `tests/unit/local-app-html.test.ts`
  覆盖新视觉方向、页面入口、状态语言、禁用旧“纸面档案”风格和营销式 hero。

- Create `openspec/changes/add-complete-app-story-cockpit-first-slice/`
  记录实现 change；不要修改已完成的设计 change。

- Create `changes/2026-05-12-complete-app-story-cockpit-first-slice.md`
  记录真实发生的用户可见变化。

- Modify `docs/tech/app-ux-roadmap.md` and `docs/tech/todo-index.md`
  仅同步实现状态，不把完整多人在线平台写成已完成。

---

### Task 1: OpenSpec Implementation Change

**Files:**
- Create: `openspec/changes/add-complete-app-story-cockpit-first-slice/proposal.md`
- Create: `openspec/changes/add-complete-app-story-cockpit-first-slice/design.md`
- Create: `openspec/changes/add-complete-app-story-cockpit-first-slice/tasks.md`
- Create: `openspec/changes/add-complete-app-story-cockpit-first-slice/specs/complete-app-story-cockpit-first-slice/spec.md`

- [ ] **Step 1: Create OpenSpec folders**

Run:

```powershell
New-Item -ItemType Directory -Force openspec\changes\add-complete-app-story-cockpit-first-slice\specs\complete-app-story-cockpit-first-slice | Out-Null
```

Expected: directory exists and `git status --short` shows an untracked `openspec/changes/add-complete-app-story-cockpit-first-slice/`.

- [ ] **Step 2: Write `proposal.md`**

Content:

```markdown
## Why

P1-0 已确认完整 App 首版采用“故事驾驶舱居中”，但当前 `storyspec app` 仍是实验性本机工作台，界面仍偏功能堆叠，缺少稳定 App shell、首批页面入口和统一状态语言。后续 API contract 与页面开发需要一个 typed App state 作为共享契约。

## What Changes

- 新增 complete App state contract，把 `ProjectStatus` 映射成故事驾驶舱、页面入口、状态语言、角色能力、空状态和协作侧栏摘要。
- 新增 token-protected `/api/projects/current/app-state` endpoint。
- 重设计本机 App shell 为“工作室控制台”，首批入口包含项目/工作区、故事驾驶舱、章节与写作、候选与正典、任务中心。
- 保留现有本机项目打开/创建、章节、候选和任务 API，不新增绕过 preview / confirm / apply 的写入能力。

## Non-goals

- 不实现云端账号、真实多人实时协作、富文本编辑器、计费、公开社区或完整 SaaS。
- 不引入 Vite/React/Tailwind 构建链。
- 不修改 `dist/**`。
- 不把 Agent 或团队建议直接写入正典。

## Impact

影响 `src/app-server`、local app 单元测试、产品路线图、changeset 和 OpenSpec 记录。`storyspec app` 的本机体验会更接近完整 App 的首版结构，但仍不是云端多人平台。

## Capabilities

- `complete-app-story-cockpit-first-slice`
```

- [ ] **Step 3: Write `design.md`**

Content:

```markdown
# 完整 App 故事驾驶舱首批切片设计

## Source Boundaries

- Runtime source: `src/app-server/app-state-contract.ts`, `src/app-server/local-app-server.ts`, `src/app-server/local-app-http-server.ts`, `src/app-server/local-app-html.ts`.
- Tests: `tests/unit/app-state-contract.test.ts`, `tests/unit/local-app-server.test.ts`, `tests/unit/local-app-http-server.test.ts`, `tests/unit/local-app-html.test.ts`.
- Generated output: `dist/**` is produced by `npm run build` and must not be edited by hand.

## Contract First

The App shell must not infer story status by scraping DOM copy. `app-state-contract.ts` maps `ProjectStatus` into a stable UI state with page definitions, cockpit metrics, role capabilities, status language, empty states, and Preview / Confirm / Apply boundaries.

## UI Boundary

The HTML shell remains a zero-dependency local workbench in this slice. It uses the new state endpoint and presents the agreed first-version surfaces, but it does not claim full cloud collaboration.

## Author Control

High-impact story changes continue to route through candidate, preview, dry-run, and apply language. The UI may surface actions that jump to existing APIs, but it must not add silent canonical writes.
```

- [ ] **Step 4: Write `spec.md`**

Content:

```markdown
## ADDED Requirements

### Requirement: Local App MUST expose a complete app state contract
The local App server MUST expose a typed complete App state derived from the current project status.

#### Scenario: current story state is available
- **GIVEN** a project has been opened in the current App session
- **WHEN** the UI requests the complete App state
- **THEN** the response MUST include workspace entry, story cockpit, chapter writing, canon review, and task center page definitions
- **AND** it MUST include current story summary, blocker count, pending confirmation count, next recommended action, status language, and role capabilities.

#### Scenario: no project is opened
- **WHEN** the UI requests complete App state before opening a project
- **THEN** the server MUST reject the request using the existing token and opened-project guard.

### Requirement: Local App shell MUST present the first-version story cockpit structure
The local App HTML MUST present the agreed studio workbench structure without claiming cloud multi-user completion.

#### Scenario: shell renders primary surfaces
- **WHEN** the root HTML is rendered
- **THEN** it MUST include project/workspace entry, story cockpit, chapter writing, candidate and canon review, task center, and collaboration sidebar language.

#### Scenario: shell keeps author-control boundaries visible
- **WHEN** the root HTML is rendered
- **THEN** it MUST include candidate, preview, dry-run, apply, blocked, deferred, canon, draft, and comment status language
- **AND** it MUST avoid hero-page, paper-dossier, and operations-console visual language.
```

- [ ] **Step 5: Write `tasks.md`**

Content:

```markdown
## S. 共享契约

- [ ] S.1 建立 complete App state contract。
- [ ] S.2 新增 token-protected `/api/projects/current/app-state`。
- [ ] S.3 重设计本机 App shell 为工作室控制台。
- [ ] S.4 保留 preview / confirm / apply，不新增高影响静默写入。

## P. 实现任务

- [ ] P.1 新增 app state contract 和测试。
- [ ] P.2 接入 local app server core 与 HTTP endpoint。
- [ ] P.3 重写 local app HTML 的 shell 结构与状态语言。
- [ ] P.4 同步 docs、changeset 和 roadmap。

## V. 集成验证

- [ ] V.1 `npx openspec validate add-complete-app-story-cockpit-first-slice --strict --json --no-interactive`
- [ ] V.2 `npx vitest run tests/unit/app-state-contract.test.ts tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts`
- [ ] V.3 `npm run build`
- [ ] V.4 `npm run check:changes`
- [ ] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
```

- [ ] **Step 6: Validate OpenSpec fails only if artifacts are malformed**

Run:

```powershell
npx openspec validate add-complete-app-story-cockpit-first-slice --strict --json --no-interactive
```

Expected: JSON reports `"valid": true`.

- [ ] **Step 7: Commit only OpenSpec if pausing here**

Skip this commit if immediately continuing Task 2 in the same implementation batch. If pausing:

```powershell
git add openspec\changes\add-complete-app-story-cockpit-first-slice
git commit -m "spec: 定义完整 App 驾驶舱首批切片"
```

---

### Task 2: App State Contract

**Files:**
- Create: `tests/unit/app-state-contract.test.ts`
- Create: `src/app-server/app-state-contract.ts`

- [ ] **Step 1: Write failing tests for no project, story project, status language, and pages**

Create `tests/unit/app-state-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  COMPLETE_APP_STATUS_LANGUAGE,
  buildCompleteAppState
} from '../../src/app-server/app-state-contract.js';
import type { ProjectStatus } from '../../src/application/get-project-status.js';

const baseStatus = (overrides: Partial<ProjectStatus> = {}): ProjectStatus => ({
  projectRoot: 'D:\\project\\spell-era',
  projectName: '法术编译纪元',
  version: '1.0.0',
  method: 'three-act',
  configuredAI: ['codex'],
  handoff: {
    codexPrompts: true,
    agentsFile: true
  },
  codex: {
    prompts: true,
    agentsFile: true
  },
  story: null,
  tracking: [],
  blockers: [],
  git: {
    available: true,
    dirty: false,
    changedFiles: 0,
    files: []
  },
  navigationEntries: [],
  nextActions: ['先保存一句灵感：`storyspec story:new <故事名> --idea "<一句话创意>"`'],
  resume: {
    projectRoot: 'D:\\project\\spell-era',
    projectName: '法术编译纪元',
    stateLabel: '尚未创建故事',
    primaryAction: {
      label: '保存一句灵感',
      reason: '当前项目还没有故事。',
      copyableCommand: 'storyspec story:new <故事名> --idea "<一句话创意>"',
      writesFiles: true,
      writeMode: 'apply',
      boundary: '只保存作者明确输入。'
    },
    statusGlossary: [],
    recentProjectHint: '本机 App 会记住最近项目。',
    boundaries: ['不会绕过 preview / confirm / apply。']
  },
  ...overrides
});

describe('complete app state contract', () => {
  it('returns workspace entry state when no project status is available', () => {
    const state = buildCompleteAppState();

    expect(state.currentPage).toBe('workspace-entry');
    expect(state.project).toEqual({
      opened: false,
      name: '尚未打开项目',
      root: undefined
    });
    expect(state.pages.map(page => page.id)).toEqual([
      'workspace-entry',
      'story-cockpit',
      'chapter-writing',
      'canon-review',
      'task-center'
    ]);
    expect(state.cockpit.primaryAction.writeMode).toBe('read-only');
    expect(state.emptyStates.noProject.primaryAction).toBe('打开已有项目');
  });

  it('maps an empty opened project to project setup guidance', () => {
    const state = buildCompleteAppState(baseStatus());

    expect(state.project).toMatchObject({
      opened: true,
      name: '法术编译纪元',
      root: 'D:\\project\\spell-era'
    });
    expect(state.currentPage).toBe('workspace-entry');
    expect(state.cockpit.storyName).toBe('尚未创建故事');
    expect(state.cockpit.primaryAction.label).toBe('保存一句灵感');
    expect(state.cockpit.metrics.pendingConfirmations).toBe(0);
    expect(state.cockpit.metrics.blockers).toBe(0);
  });

  it('maps a story project to story cockpit state with visible author-control boundaries', () => {
    const state = buildCompleteAppState(baseStatus({
      story: {
        name: '编程施法',
        path: 'D:\\project\\spell-era\\stories\\编程施法',
        stage: 'tasked',
        hasIdea: true,
        hasClarifications: true,
        hasCandidates: true,
        hasSpecification: true,
        hasCreativePlan: true,
        hasTasks: true,
        specificationVersion: 'v1',
        creativePlanVersion: 'plan-v1',
        tasksVersion: 'tasks-v1',
        nextTask: 'T001 - 写第一章',
        chapterFiles: 1,
        contentFiles: 1,
        contentChars: 1200,
        creativeGaps: ['核心伙伴动机仍需确认'],
        nextQuestions: ['第一章是否提前揭示魔法代价？'],
        creativeControl: {
          confirmedDecisions: 2,
          pendingDecisions: 3,
          unconfirmedAiSuggestions: 1,
          cannotFinalize: ['AI 建议待确认：magic.cost']
        },
        creationEcho: {
          flavor: '工程思维处理符文魔法',
          maturityNote: '已可拆任务',
          strongestParts: ['主角能力风味明确'],
          missingPieces: ['核心伙伴动机']
        }
      },
      blockers: [{
        severity: 'warning',
        scope: 'task-output',
        code: 'MISSING_TASK_OUTPUT',
        message: '任务输出缺失',
        path: 'content/chapter-02.md'
      }],
      resume: {
        projectRoot: 'D:\\project\\spell-era',
        projectName: '法术编译纪元',
        storyName: '编程施法',
        stage: 'tasked',
        stateLabel: '任务已生成，准备写作',
        primaryAction: {
          label: '继续下一项写作任务',
          reason: 'T001 - 写第一章',
          copyableCommand: 'storyspec context:pack 编程施法',
          writesFiles: false,
          writeMode: 'read-only',
          boundary: '先生成上下文包。'
        },
        statusGlossary: [],
        recentProjectHint: '本机 App 会记住最近项目。',
        boundaries: ['不会绕过 preview / confirm / apply。']
      }
    }));

    expect(state.currentPage).toBe('story-cockpit');
    expect(state.cockpit.storyName).toBe('编程施法');
    expect(state.cockpit.stageLabel).toBe('任务已生成，准备写作');
    expect(state.cockpit.metrics.pendingConfirmations).toBe(3);
    expect(state.cockpit.metrics.blockers).toBe(1);
    expect(state.cockpit.metrics.chapterFiles).toBe(1);
    expect(state.collaborationRail.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '待确认', value: '3' }),
      expect.objectContaining({ label: '阻塞', value: '1' }),
      expect.objectContaining({ label: 'Agent 候选', value: '1' })
    ]));
  });

  it('publishes stable status language and role capabilities', () => {
    const state = buildCompleteAppState(baseStatus());

    expect(COMPLETE_APP_STATUS_LANGUAGE.map(item => item.term)).toEqual([
      'candidate',
      'preview',
      'dry-run',
      'apply',
      'blocked',
      'deferred',
      'canon',
      'draft',
      'comment'
    ]);
    expect(state.roles.find(role => role.id === 'author')).toMatchObject({
      label: '作者',
      canConfirmHighImpactChanges: true
    });
    expect(state.roles.find(role => role.id === 'viewer')).toMatchObject({
      label: '只读成员',
      canConfirmHighImpactChanges: false
    });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npx vitest run tests/unit/app-state-contract.test.ts
```

Expected: FAIL because `src/app-server/app-state-contract.ts` does not exist.

- [ ] **Step 3: Implement `app-state-contract.ts`**

Create `src/app-server/app-state-contract.ts`:

```ts
import type {
  ProjectResumeAction,
  ProjectResumeWriteMode,
  ProjectStatus
} from '../application/get-project-status.js';

export type CompleteAppPageId =
  | 'workspace-entry'
  | 'story-cockpit'
  | 'chapter-writing'
  | 'canon-review'
  | 'task-center';

export type CompleteAppRoleId = 'author' | 'editor' | 'reviewer' | 'viewer' | 'agent';

export interface CompleteAppPage {
  id: CompleteAppPageId;
  label: string;
  purpose: string;
  primaryAction: string;
  route: string;
  enabled: boolean;
}

export interface CompleteAppStatusLanguageEntry {
  term: ProjectResumeWriteMode | 'deferred' | 'canon' | 'draft' | 'comment';
  label: string;
  meaning: string;
  primaryAction: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CompleteAppRoleCapability {
  id: CompleteAppRoleId;
  label: string;
  description: string;
  canComment: boolean;
  canSubmitCandidates: boolean;
  canConfirmHighImpactChanges: boolean;
}

export interface CompleteAppMetricSummary {
  pendingConfirmations: number;
  blockers: number;
  chapterFiles: number;
  contentChars: number;
}

export interface CompleteAppCockpitState {
  storyName: string;
  stageLabel: string;
  currentBlocker: string;
  primaryAction: ProjectResumeAction;
  metrics: CompleteAppMetricSummary;
  boundaries: string[];
}

export interface CompleteAppRailItem {
  label: string;
  value: string;
  tone: 'info' | 'attention' | 'success' | 'neutral';
}

export interface CompleteAppState {
  project: {
    opened: boolean;
    name: string;
    root?: string;
  };
  currentPage: CompleteAppPageId;
  pages: CompleteAppPage[];
  cockpit: CompleteAppCockpitState;
  collaborationRail: {
    title: string;
    items: CompleteAppRailItem[];
  };
  roles: CompleteAppRoleCapability[];
  statusLanguage: CompleteAppStatusLanguageEntry[];
  emptyStates: {
    noProject: {
      title: string;
      body: string;
      primaryAction: string;
    };
    noStory: {
      title: string;
      body: string;
      primaryAction: string;
    };
  };
}

export const COMPLETE_APP_STATUS_LANGUAGE: CompleteAppStatusLanguageEntry[] = [
  {
    term: 'candidate',
    label: '候选方案',
    meaning: '可参考但尚未确认，不是正式故事事实。',
    primaryAction: '预览、接受、驳回、请求修改',
    riskLevel: 'medium'
  },
  {
    term: 'preview',
    label: '预览变更',
    meaning: '只展示影响，不会自动写入正式故事。',
    primaryAction: '查看差异、确认、返回修改',
    riskLevel: 'medium'
  },
  {
    term: 'dry-run',
    label: '试运行',
    meaning: '检查结果和影响，不执行写入。',
    primaryAction: '查看报告、修复问题、重新运行',
    riskLevel: 'low'
  },
  {
    term: 'apply',
    label: '应用到正式故事',
    meaning: '经确认后写入草稿、正典或任务状态。',
    primaryAction: '确认应用、查看来源、回滚入口',
    riskLevel: 'high'
  },
  {
    term: 'blocked',
    label: '暂时无法继续',
    meaning: '有缺失、冲突、权限或任务失败阻塞流程。',
    primaryAction: '查看原因、处理阻塞、创建任务',
    riskLevel: 'high'
  },
  {
    term: 'deferred',
    label: '稍后决定',
    meaning: '用户明确保留未确认状态，不当作完成。',
    primaryAction: '稍后提醒、保留在队列、重新打开',
    riskLevel: 'medium'
  },
  {
    term: 'canon',
    label: '正典 / 已确认事实',
    meaning: '已被作者或授权成员确认的故事事实。',
    primaryAction: '查看来源、引用、申请修改',
    riskLevel: 'high'
  },
  {
    term: 'draft',
    label: '草稿',
    meaning: '可编辑文本，不等同于正典事实。',
    primaryAction: '保存、提交审阅、创建候选',
    riskLevel: 'medium'
  },
  {
    term: 'comment',
    label: '评论',
    meaning: '审阅意见或讨论，不直接改变故事。',
    primaryAction: '回复、解决、转任务',
    riskLevel: 'low'
  }
];

export const COMPLETE_APP_ROLES: CompleteAppRoleCapability[] = [
  {
    id: 'author',
    label: '作者',
    description: '拥有故事方向、正典事实和最终确认权。',
    canComment: true,
    canSubmitCandidates: true,
    canConfirmHighImpactChanges: true
  },
  {
    id: 'editor',
    label: '编辑',
    description: '帮助整理设定、章节节奏和审阅意见。',
    canComment: true,
    canSubmitCandidates: true,
    canConfirmHighImpactChanges: false
  },
  {
    id: 'reviewer',
    label: '审稿者',
    description: '提出批注和修改建议。',
    canComment: true,
    canSubmitCandidates: true,
    canConfirmHighImpactChanges: false
  },
  {
    id: 'viewer',
    label: '只读成员',
    description: '查看项目状态、章节进展和已确认事实。',
    canComment: false,
    canSubmitCandidates: false,
    canConfirmHighImpactChanges: false
  },
  {
    id: 'agent',
    label: 'Agent',
    description: '提交结构化候选、检查结果、任务状态和失败原因。',
    canComment: false,
    canSubmitCandidates: true,
    canConfirmHighImpactChanges: false
  }
];

export const COMPLETE_APP_PAGES: CompleteAppPage[] = [
  {
    id: 'workspace-entry',
    label: '项目与故事',
    purpose: '创建项目、打开已有项目、查看最近项目和选择当前故事。',
    primaryAction: '打开或创建项目',
    route: '#workspace-entry',
    enabled: true
  },
  {
    id: 'story-cockpit',
    label: '故事驾驶舱',
    purpose: '查看当前故事状态、卡点、下一步、章节进度和待确认内容。',
    primaryAction: '继续下一步',
    route: '#story-cockpit',
    enabled: true
  },
  {
    id: 'chapter-writing',
    label: '章节与写作',
    purpose: '推进 outline、scene、sample、draft、review 写作通道。',
    primaryAction: '进入章节通道',
    route: '#chapter-writing',
    enabled: true
  },
  {
    id: 'canon-review',
    label: '候选与正典',
    purpose: '处理候选、冲突、预览、确认、来源追踪和正典状态。',
    primaryAction: '处理候选',
    route: '#canon-review',
    enabled: true
  },
  {
    id: 'task-center',
    label: '任务中心',
    purpose: '解释 Agent run、人工任务、失败、阻塞、重试和跳转目标。',
    primaryAction: '查看任务',
    route: '#task-center',
    enabled: true
  }
];

const readOnlyAction = (label: string, reason: string): ProjectResumeAction => ({
  label,
  reason,
  copyableCommand: 'storyspec app',
  writesFiles: false,
  writeMode: 'read-only',
  boundary: '只导航，不写入正式故事。'
});

const currentPageFor = (status?: ProjectStatus): CompleteAppPageId => {
  if (!status || !status.story) {
    return 'workspace-entry';
  }

  return 'story-cockpit';
};

const blockerMessage = (status?: ProjectStatus): string => {
  if (!status) {
    return '尚未打开项目。';
  }

  if (!status.story) {
    return '尚未创建故事。';
  }

  if (status.blockers.length > 0) {
    return status.blockers[0]?.message ?? '存在阻塞项。';
  }

  if (status.story.creativeControl.pendingDecisions > 0) {
    return `还有 ${status.story.creativeControl.pendingDecisions} 个创作决策待确认。`;
  }

  return '当前没有阻塞项。';
};

export const buildCompleteAppState = (status?: ProjectStatus): CompleteAppState => {
  const pendingConfirmations = status?.story?.creativeControl.pendingDecisions ?? 0;
  const blockers = status?.blockers.length ?? 0;
  const unconfirmedAi = status?.story?.creativeControl.unconfirmedAiSuggestions ?? 0;
  const primaryAction = status?.resume.primaryAction
    ?? readOnlyAction('打开已有项目', '先打开或创建一个 StorySpec 项目。');

  return {
    project: {
      opened: Boolean(status),
      name: status?.projectName ?? '尚未打开项目',
      root: status?.projectRoot
    },
    currentPage: currentPageFor(status),
    pages: COMPLETE_APP_PAGES,
    cockpit: {
      storyName: status?.story?.name ?? '尚未创建故事',
      stageLabel: status?.resume.stateLabel ?? '尚未打开项目',
      currentBlocker: blockerMessage(status),
      primaryAction,
      metrics: {
        pendingConfirmations,
        blockers,
        chapterFiles: status?.story?.chapterFiles ?? 0,
        contentChars: status?.story?.contentChars ?? 0
      },
      boundaries: status?.resume.boundaries ?? ['不会绕过 preview / confirm / apply。']
    },
    collaborationRail: {
      title: '协作侧栏',
      items: [
        {
          label: '待确认',
          value: String(pendingConfirmations),
          tone: pendingConfirmations > 0 ? 'attention' : 'neutral'
        },
        {
          label: '阻塞',
          value: String(blockers),
          tone: blockers > 0 ? 'attention' : 'success'
        },
        {
          label: 'Agent 候选',
          value: String(unconfirmedAi),
          tone: unconfirmedAi > 0 ? 'info' : 'neutral'
        }
      ]
    },
    roles: COMPLETE_APP_ROLES,
    statusLanguage: COMPLETE_APP_STATUS_LANGUAGE,
    emptyStates: {
      noProject: {
        title: '尚未打开项目',
        body: '打开已有 StorySpec 项目，或创建一个新故事项目。',
        primaryAction: '打开已有项目'
      },
      noStory: {
        title: '尚未创建故事',
        body: '先保存一句灵感，再进入低负担共创。',
        primaryAction: '保存一句灵感'
      }
    }
  };
};
```

- [ ] **Step 4: Run contract tests**

Run:

```powershell
npx vitest run tests/unit/app-state-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```powershell
git add src\app-server\app-state-contract.ts tests\unit\app-state-contract.test.ts
git commit -m "feat: 定义完整 App 状态契约"
```

---

### Task 3: Local Server Endpoint

**Files:**
- Modify: `src/app-server/local-app-server.ts`
- Modify: `src/app-server/local-app-http-server.ts`
- Modify: `tests/unit/local-app-server.test.ts`
- Modify: `tests/unit/local-app-http-server.test.ts`

- [ ] **Step 1: Add failing core test**

Append to `tests/unit/local-app-server.test.ts`:

```ts
  it('returns complete app state for the current opened project', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fs.ensureDir(path.join(projectRoot, '.specify'));
    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: fs,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元',
        version: '1.0.0',
        method: 'three-act',
        configuredAI: ['codex'],
        handoff: { codexPrompts: true, agentsFile: true },
        codex: { prompts: true, agentsFile: true },
        story: null,
        tracking: [],
        blockers: [],
        git: { available: true, dirty: false, changedFiles: 0, files: [] },
        navigationEntries: [],
        nextActions: [],
        resume: {
          projectRoot: input.projectRoot,
          projectName: '法术编译纪元',
          stateLabel: '尚未创建故事',
          primaryAction: {
            label: '保存一句灵感',
            reason: '当前项目还没有故事。',
            copyableCommand: 'storyspec story:new <故事名> --idea "<一句话创意>"',
            writesFiles: true,
            writeMode: 'apply',
            boundary: '只保存作者明确输入。'
          },
          statusGlossary: [],
          recentProjectHint: '本机 App 会记住最近项目。',
          boundaries: ['不会绕过 preview / confirm / apply。']
        }
      })
    });

    await expect(core.getCurrentCompleteAppState({ token: 'wrong' })).resolves.toMatchObject({
      status: 401
    });
    await expect(core.getCurrentCompleteAppState({ token: 'secret' })).resolves.toMatchObject({
      status: 403
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.getCurrentCompleteAppState({ token: 'secret' })).resolves.toMatchObject({
      status: 200,
      body: {
        project: {
          opened: true,
          name: '法术编译纪元',
          root: projectRoot
        },
        pages: [
          { id: 'workspace-entry' },
          { id: 'story-cockpit' },
          { id: 'chapter-writing' },
          { id: 'canon-review' },
          { id: 'task-center' }
        ],
        cockpit: {
          storyName: '尚未创建故事',
          primaryAction: {
            writeMode: 'apply'
          }
        }
      }
    });
  });
```

- [ ] **Step 2: Run core test to verify failure**

Run:

```powershell
npx vitest run tests/unit/local-app-server.test.ts -t "complete app state"
```

Expected: FAIL with `getCurrentCompleteAppState is not a function` or TypeScript equivalent.

- [ ] **Step 3: Implement core method**

In `src/app-server/local-app-server.ts`, add imports:

```ts
import {
  buildCompleteAppState,
  type CompleteAppState
} from './app-state-contract.js';
```

Add request interface near `CurrentProjectResumeRequest`:

```ts
export interface CurrentCompleteAppStateRequest {
  token: string;
}
```

Inside returned object from `createLocalAppServerCore`, add method after `getCurrentProjectResume`:

```ts
    async getCurrentCompleteAppState(request: CurrentCompleteAppStateRequest): Promise<LocalAppServerResponse<CompleteAppState | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      const status = await input.projectStatus({ projectRoot });

      return {
        status: 200,
        body: buildCompleteAppState(status as ProjectStatus)
      };
    },
```

Also import `type ProjectStatus`:

```ts
import type { ProjectStatus } from '../application/get-project-status.js';
```

- [ ] **Step 4: Run core test**

Run:

```powershell
npx vitest run tests/unit/local-app-server.test.ts -t "complete app state"
```

Expected: PASS.

- [ ] **Step 5: Add failing HTTP test**

Append to `tests/unit/local-app-http-server.test.ts`:

```ts
  it('serves complete app state through a token-protected endpoint', async () => {
    const projectRoot = await makeTempDir();
    await mkdir(path.join(projectRoot, '.specify'), { recursive: true });
    await writeFile(path.join(projectRoot, '.specify', 'config.json'), JSON.stringify({
      name: '法术编译纪元'
    }));
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: nodeFileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元',
        version: '1.0.0',
        method: 'three-act',
        configuredAI: ['codex'],
        handoff: { codexPrompts: true, agentsFile: true },
        codex: { prompts: true, agentsFile: true },
        story: null,
        tracking: [],
        blockers: [],
        git: { available: true, dirty: false, changedFiles: 0, files: [] },
        navigationEntries: [],
        nextActions: [],
        resume: {
          projectRoot: input.projectRoot,
          projectName: '法术编译纪元',
          stateLabel: '尚未创建故事',
          primaryAction: {
            label: '保存一句灵感',
            reason: '当前项目还没有故事。',
            copyableCommand: 'storyspec story:new <故事名> --idea "<一句话创意>"',
            writesFiles: true,
            writeMode: 'apply',
            boundary: '只保存作者明确输入。'
          },
          statusGlossary: [],
          recentProjectHint: '本机 App 会记住最近项目。',
          boundaries: ['不会绕过 preview / confirm / apply。']
        }
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core,
      token: 'secret'
    });

    try {
      const unauthorized = await fetch(`${server.url}/api/projects/current/app-state`);
      expect(unauthorized.status).toBe(401);

      await fetch(`${server.url}/api/projects/open`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({ projectRoot })
      });

      const response = await fetch(`${server.url}/api/projects/current/app-state`, {
        headers: { 'x-storyspec-app-token': 'secret' }
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        project: { opened: true, name: '法术编译纪元' },
        currentPage: 'workspace-entry',
        pages: [{ id: 'workspace-entry' }, { id: 'story-cockpit' }],
        statusLanguage: [{ term: 'candidate' }, { term: 'preview' }]
      });
    } finally {
      await server.close();
    }
  });
```

- [ ] **Step 6: Run HTTP test to verify failure**

Run:

```powershell
npx vitest run tests/unit/local-app-http-server.test.ts -t "complete app state"
```

Expected: FAIL with 404 or missing core method in HTTP interface.

- [ ] **Step 7: Implement HTTP route**

In `src/app-server/local-app-http-server.ts`, add to `LocalAppHttpCore`:

```ts
  getCurrentCompleteAppState(request: { token: string }): Promise<{ status: number; body: unknown }>;
```

Add route after `/api/projects/current/resume`:

```ts
      if (request.method === 'GET' && url.pathname === '/api/projects/current/app-state') {
        const result = await input.core.getCurrentCompleteAppState({
          token: getToken(request)
        });
        sendJson(response, result.status, result.body);
        return;
      }
```

- [ ] **Step 8: Run server tests**

Run:

```powershell
npx vitest run tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```powershell
git add src\app-server\local-app-server.ts src\app-server\local-app-http-server.ts tests\unit\local-app-server.test.ts tests\unit\local-app-http-server.test.ts
git commit -m "feat: 暴露完整 App 状态端点"
```

---

### Task 4: Studio Workbench HTML Shell

**Files:**
- Modify: `tests/unit/local-app-html.test.ts`
- Modify: `src/app-server/local-app-html.ts`

- [ ] **Step 1: Replace HTML shell expectations with cockpit structure**

Update the first test in `tests/unit/local-app-html.test.ts` to assert the new shell:

```ts
  it('renders the studio workbench shell with story cockpit navigation', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('StorySpec 工作室');
    expect(html).toContain('项目与故事');
    expect(html).toContain('故事驾驶舱');
    expect(html).toContain('章节与写作');
    expect(html).toContain('候选与正典');
    expect(html).toContain('任务中心');
    expect(html).toContain('协作侧栏');
    expect(html).toContain('Preview / Confirm / Apply');
    expect(html).toContain('/api/projects/current/app-state');
    expect(html).toContain('id="app-state-root"');
    expect(html).toContain('id="story-cockpit-panel"');
    expect(html).toContain('secret-token');
    expect(html).toContain('x-storyspec-app-token');
  });
```

- [ ] **Step 2: Replace visual anti-pattern test**

Update the anti-pattern test:

```ts
  it('uses studio workbench styling instead of paper dossier, marketing hero, or ops console styling', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    }).toLowerCase();

    expect(html).toContain('--app-bg: #f8fafc');
    expect(html).toContain('--accent: #2563eb');
    expect(html).toContain('--attention: #f97316');
    expect(html).not.toContain('纸面档案');
    expect(html).not.toContain('ui-serif');
    expect(html).not.toContain('hero');
    expect(html).not.toContain('linear-gradient');
    expect(html).not.toContain('glassmorphism');
    expect(html).not.toContain('backdrop-filter');
    expect(html).not.toContain('purple');
    expect(html).not.toContain('blueviolet');
  });
```

- [ ] **Step 3: Add status language and role tests**

Add:

```ts
  it('renders readable status language and role boundaries', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('候选方案');
    expect(html).toContain('预览变更');
    expect(html).toContain('试运行');
    expect(html).toContain('应用到正式故事');
    expect(html).toContain('暂时无法继续');
    expect(html).toContain('稍后决定');
    expect(html).toContain('正典 / 已确认事实');
    expect(html).toContain('草稿');
    expect(html).toContain('评论');
    expect(html).toContain('作者最终确认');
    expect(html).toContain('Agent 不能直接写入正典');
  });
```

- [ ] **Step 4: Run HTML tests to verify failure**

Run:

```powershell
npx vitest run tests/unit/local-app-html.test.ts
```

Expected: FAIL because current HTML still says `StorySpec 本机工作台` and lacks `app-state-root`.

- [ ] **Step 5: Update `renderLocalAppHtml` static shell copy and CSS tokens**

In `src/app-server/local-app-html.ts`, replace title/header copy and CSS tokens with:

```html
  <title>StorySpec 工作室</title>
  <meta name="description" content="StorySpec 本机故事驾驶舱和协作写作工作台">
```

CSS token block:

```css
    :root {
      color-scheme: light;
      --app-bg: #f8fafc;
      --surface: #ffffff;
      --surface-muted: #eef2f7;
      --ink: #172033;
      --muted: #64748b;
      --line: #d7dee8;
      --accent: #2563eb;
      --accent-soft: #dbeafe;
      --attention: #f97316;
      --attention-soft: #fff7ed;
      --success: #16a34a;
      --success-soft: #f0fdf4;
      --danger: #b91c1c;
      --radius: 8px;
      --z-focus: 10;
    }
```

Body font:

```css
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", system-ui, sans-serif;
```

Header copy:

```html
        <h1>StorySpec 工作室</h1>
        <p class="subtitle">故事驾驶舱、章节写作、候选正典和任务中心集中在一个本机工作台里。高影响内容仍需 Preview / Confirm / Apply。</p>
```

- [ ] **Step 6: Add shell containers and navigation ids**

Ensure the HTML contains these stable ids and labels:

```html
<div id="app-state-root" class="app-layout">
  <nav class="side-nav" aria-label="完整 App 首批页面">
    <a href="#workspace-entry">项目与故事</a>
    <a href="#story-cockpit">故事驾驶舱</a>
    <a href="#chapter-writing">章节与写作</a>
    <a href="#canon-review">候选与正典</a>
    <a href="#task-center">任务中心</a>
  </nav>
  <section id="story-cockpit-panel" aria-labelledby="story-cockpit-title">
    <h2 id="story-cockpit-title">故事驾驶舱</h2>
  </section>
  <aside class="collaboration-rail" aria-label="协作侧栏">
    <h2>协作侧栏</h2>
  </aside>
</div>
```

The existing project forms, story intake forms, outline controls, task board controls, and chapter controls may remain in the page, but they should be visually grouped under the new first-batch surfaces rather than the old `项目抽屉 / 故事档案 / 确认通道` headings.

- [ ] **Step 7: Add App state loading script**

Add a loader that calls the new endpoint and renders cockpit text without breaking existing API calls:

```js
    const appStateRoot = document.querySelector("#app-state-root");
    const storyCockpitPanel = document.querySelector("#story-cockpit-panel");

    const renderAppState = state => {
      if (!appStateRoot || !storyCockpitPanel) {
        return;
      }

      storyCockpitPanel.innerHTML = `
        <div class="panel-header">
          <h2 id="story-cockpit-title">故事驾驶舱</h2>
          <span class="status-pill">${escapeHtml(state.cockpit?.stageLabel || "尚未打开项目")}</span>
        </div>
        <div class="panel-body stack">
          <p><strong>${escapeHtml(state.cockpit?.storyName || "尚未创建故事")}</strong></p>
          <p class="muted">${escapeHtml(state.cockpit?.currentBlocker || "打开项目后显示当前卡点。")}</p>
          <div class="metric-grid">
            <div class="metric"><span class="metric-value">${escapeHtml(String(state.cockpit?.metrics?.pendingConfirmations ?? 0))}</span><span class="metric-label">待确认</span></div>
            <div class="metric"><span class="metric-value">${escapeHtml(String(state.cockpit?.metrics?.blockers ?? 0))}</span><span class="metric-label">阻塞</span></div>
            <div class="metric"><span class="metric-value">${escapeHtml(String(state.cockpit?.metrics?.chapterFiles ?? 0))}</span><span class="metric-label">章节</span></div>
          </div>
          <div class="action-card">
            <h3>${escapeHtml(state.cockpit?.primaryAction?.label || "打开已有项目")}</h3>
            <p>${escapeHtml(state.cockpit?.primaryAction?.reason || "先打开或创建一个 StorySpec 项目。")}</p>
            <p class="muted">写入模式：${escapeHtml(state.cockpit?.primaryAction?.writeMode || "read-only")}</p>
          </div>
        </div>
      `;
    };

    const loadAppState = async () => {
      try {
        const state = await api("/api/projects/current/app-state", { method: "GET" });
        renderAppState(state);
      } catch {
        renderAppState({
          cockpit: {
            storyName: "尚未打开项目",
            stageLabel: "项目入口",
            currentBlocker: "打开已有项目，或创建一个新故事项目。",
            primaryAction: {
              label: "打开已有项目",
              reason: "先选择 StorySpec 项目根目录。",
              writeMode: "read-only"
            },
            metrics: {
              pendingConfirmations: 0,
              blockers: 0,
              chapterFiles: 0
            }
          }
        });
      }
    };
```

Call `await loadAppState()` after `loadStatus()` and after project open/create actions.

- [ ] **Step 8: Run HTML tests**

Run:

```powershell
npx vitest run tests/unit/local-app-html.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 4**

```powershell
git add src\app-server\local-app-html.ts tests\unit\local-app-html.test.ts
git commit -m "feat: 重设计本机 App 工作室控制台"
```

---

### Task 5: Docs, Changeset, and Roadmap State

**Files:**
- Create: `changes/2026-05-12-complete-app-story-cockpit-first-slice.md`
- Modify: `docs/tech/app-ux-roadmap.md`
- Modify: `docs/tech/todo-index.md`
- Modify: `openspec/changes/add-complete-app-story-cockpit-first-slice/tasks.md`

- [ ] **Step 1: Add changeset**

Create `changes/2026-05-12-complete-app-story-cockpit-first-slice.md`:

```markdown
# 完整 App 故事驾驶舱首批切片

- 新增完整 App state contract，把当前项目状态映射为故事驾驶舱、首批页面入口、状态语言、角色能力和协作侧栏摘要。
- 新增本机 App `/api/projects/current/app-state` endpoint，沿用 session token 和已打开项目 allowlist。
- 重设计 `storyspec app` 本机 HTML shell 为“工作室控制台”，突出项目/工作区、故事驾驶舱、章节与写作、候选与正典、任务中心和 Preview / Confirm / Apply 边界。
- 该变更不实现云端账号、真实多人实时协作、富文本编辑器或 SaaS 部署。
```

- [ ] **Step 2: Update `docs/tech/app-ux-roadmap.md`**

Under `P1-0 完整 App 产品体验与界面重设计`, add:

```markdown
- 首批实现切片：已通过 `add-complete-app-story-cockpit-first-slice` 建立 complete App state contract、本机 App 状态 endpoint 和工作室控制台 shell；后续仍需 API contract、真实多人平台和完整前端架构。
```

- [ ] **Step 3: Update `docs/tech/todo-index.md`**

Update current mainline paragraph to mention:

```markdown
P1-0 首批实现切片完成后，下一步仍是 P1-2 API contract 与前端状态模型前置设计；完整多人在线平台尚未完成。
```

- [ ] **Step 4: Mark OpenSpec verification tasks done after commands pass**

Only after Task 6 passes, set these checkboxes to `[x]` in `openspec/changes/add-complete-app-story-cockpit-first-slice/tasks.md`:

```markdown
- [x] V.1 `npx openspec validate add-complete-app-story-cockpit-first-slice --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/app-state-contract.test.ts tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
```

- [ ] **Step 5: Commit docs only after final verification**

Do not commit here yet if Task 6 is next. Commit all remaining files after verification.

---

### Task 6: Final Verification and Commit

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run OpenSpec validation**

Run:

```powershell
npx openspec validate add-complete-app-story-cockpit-first-slice --strict --json --no-interactive
```

Expected: JSON reports `"valid": true`.

- [ ] **Step 2: Run targeted tests**

Run:

```powershell
npx vitest run tests/unit/app-state-contract.test.ts tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts
```

Expected: all listed unit tests PASS.

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: TypeScript build completes successfully and `scripts/postbuild.cjs` runs without errors.

- [ ] **Step 4: Run changeset check**

Run:

```powershell
npm run check:changes
```

Expected: `变更记录检查通过`.

- [ ] **Step 5: Run whitespace diff check**

Run:

```powershell
git diff --check
```

Expected: no errors. Git may print LF/CRLF warnings; those are not diff-check failures.

- [ ] **Step 6: Inspect status**

Run:

```powershell
git status --short
```

Expected: only files from this plan are modified or untracked.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src\app-server\app-state-contract.ts src\app-server\local-app-server.ts src\app-server\local-app-http-server.ts src\app-server\local-app-html.ts tests\unit\app-state-contract.test.ts tests\unit\local-app-server.test.ts tests\unit\local-app-http-server.test.ts tests\unit\local-app-html.test.ts openspec\changes\add-complete-app-story-cockpit-first-slice changes\2026-05-12-complete-app-story-cockpit-first-slice.md docs\tech\app-ux-roadmap.md docs\tech\todo-index.md
git commit -m "feat: 实现完整 App 驾驶舱首批切片"
```

Expected: commit succeeds. Do not push.

---

## Self-Review

- Spec coverage: covers workspace entry, story cockpit, chapter writing, canon review, task center, Preview / Confirm / Apply, visual direction, status language, empty states, token guard, and no-cloud/non-realtime boundary.
- Implementation scope: intentionally limited to typed state contract, endpoint, and local shell redesign. It does not attempt full API contract, database, Redis worker, auth accounts, rich editor, or realtime collaboration.
- Type consistency: `CompleteAppState`, `CompleteAppPageId`, `CompleteAppRoleCapability`, and `CompleteAppStatusLanguageEntry` are defined before server and HTML tasks reference them.
- Verification: OpenSpec, targeted tests, build, changeset, and diff check are all explicit.
