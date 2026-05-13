import { describe, expect, it } from 'vitest';
import {
  COMPLETE_APP_STATUS_LANGUAGE,
  COMPLETE_APP_WRITE_MODE_LANGUAGE,
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

const storySummary = (
  overrides: Partial<NonNullable<ProjectStatus['story']>> = {}
): NonNullable<ProjectStatus['story']> => ({
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
    expect(state.pages).toEqual([
      {
        id: 'workspace-entry',
        label: '工作区入口',
        purpose: '打开项目、查看最近项目和开始新故事。',
        description: '打开项目、查看最近项目和开始新故事。',
        primaryAction: '打开已有项目',
        route: '#workspace-entry',
        enabled: true
      },
      {
        id: 'story-cockpit',
        label: '故事驾驶舱',
        purpose: '查看故事阶段、下一步动作和创作控制权状态。',
        description: '查看故事阶段、下一步动作和创作控制权状态。',
        primaryAction: '查看下一步',
        route: '#story-cockpit',
        enabled: true
      },
      {
        id: 'chapter-writing',
        label: '章节与写作',
        purpose: '进入章节草稿、上下文包和写作任务。',
        description: '进入章节草稿、上下文包和写作任务。',
        primaryAction: '进入章节与写作',
        route: '#chapter-writing',
        enabled: true
      },
      {
        id: 'canon-review',
        label: '正典复核',
        purpose: '复核已确认事实、候选和冲突。',
        description: '复核已确认事实、候选和冲突。',
        primaryAction: '复核正典',
        route: '#canon-review',
        enabled: true
      },
      {
        id: 'task-center',
        label: '任务中心',
        purpose: '查看任务清单、阻塞和检查结果。',
        description: '查看任务清单、阻塞和检查结果。',
        primaryAction: '查看任务',
        route: '#task-center',
        enabled: true
      }
    ]);
    expect(state.cockpit.currentBlocker).toBe('尚未打开项目。');
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
    expect(state.cockpit.currentBlocker).toBe('尚未创建故事。');
    expect(state.cockpit.primaryAction.label).toBe('保存一句灵感');
    expect(state.cockpit.metrics.pendingConfirmations).toBe(0);
    expect(state.cockpit.metrics.blockers).toBe(0);
  });

  it('maps a story project to story cockpit state with visible author-control boundaries', () => {
    const state = buildCompleteAppState(baseStatus({
      story: storySummary(),
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
    expect(state.cockpit.currentBlocker).toBe('任务输出缺失');
    expect(state.cockpit.metrics.pendingConfirmations).toBe(3);
    expect(state.cockpit.metrics.blockers).toBe(1);
    expect(state.cockpit.metrics.chapterFiles).toBe(1);
    expect(state.collaborationRail.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '待确认', value: '3' }),
      expect.objectContaining({ label: '阻塞', value: '1' }),
      expect.objectContaining({ label: 'Agent 候选', value: '1' })
    ]));
  });

  it('shows pending decisions as the current blocker when no artifact blocker exists', () => {
    const state = buildCompleteAppState(baseStatus({
      story: storySummary({
        creativeControl: {
          confirmedDecisions: 2,
          pendingDecisions: 3,
          unconfirmedAiSuggestions: 1,
          cannotFinalize: ['AI 建议待确认：magic.cost']
        }
      })
    }));

    expect(state.cockpit.currentBlocker).toBe('还有 3 个创作决策待确认。');
  });

  it('publishes stable status language, empty states, and role capabilities', () => {
    const state = buildCompleteAppState(baseStatus());

    expect(COMPLETE_APP_STATUS_LANGUAGE).toEqual([
      {
        term: 'candidate',
        label: '候选方案',
        meaning: 'AI 或作者提出的可选内容，确认前不进入正典。',
        primaryAction: '比较并等待作者确认',
        riskLevel: 'low'
      },
      {
        term: 'preview',
        label: '预览变更',
        meaning: '展示即将生成或覆盖的内容，确认前不写入正式文件。',
        primaryAction: '检查差异后决定是否应用',
        riskLevel: 'medium'
      },
      {
        term: 'dry-run',
        label: '试运行',
        meaning: '只展示将发生的操作，不执行写入。',
        primaryAction: '确认流程和影响范围',
        riskLevel: 'low'
      },
      {
        term: 'apply',
        label: '应用到正式故事',
        meaning: '作者确认后的落盘动作，会改变正式故事文件。',
        primaryAction: '写入已确认内容',
        riskLevel: 'high'
      },
      {
        term: 'blocked',
        label: '暂时无法继续',
        meaning: '缺少必要输入或存在风险，需要先处理。',
        primaryAction: '处理阻塞原因',
        riskLevel: 'high'
      },
      {
        term: 'deferred',
        label: '稍后决定',
        meaning: '已记录但暂不进入当前创作路线。',
        primaryAction: '保留到后续分支或复核',
        riskLevel: 'low'
      },
      {
        term: 'canon',
        label: '正典 / 已确认事实',
        meaning: '作者确认并可作为后续依据的事实。',
        primaryAction: '作为后续写作依据',
        riskLevel: 'medium'
      },
      {
        term: 'draft',
        label: '草稿',
        meaning: '正文或方案的可修改版本。',
        primaryAction: '继续写作或提交复核',
        riskLevel: 'medium'
      },
      {
        term: 'comment',
        label: '评论',
        meaning: '用于复核、讨论和标注，不直接改变故事事实。',
        primaryAction: '补充反馈或待办',
        riskLevel: 'low'
      }
    ]);
    expect(COMPLETE_APP_WRITE_MODE_LANGUAGE.map(item => item.term)).toEqual([
      'candidate',
      'preview',
      'apply',
      'dry-run',
      'blocked',
      'read-only'
    ]);
    expect(COMPLETE_APP_WRITE_MODE_LANGUAGE.find(item => item.term === 'read-only')).toMatchObject({
      label: '只读',
      meaning: '只读取或导航当前项目状态，不写入故事文件。'
    });
    expect(state.writeModeLanguage).toBe(COMPLETE_APP_WRITE_MODE_LANGUAGE);
    expect(state.emptyStates).toMatchObject({
      noStory: expect.objectContaining({ primaryAction: '保存一句灵感' }),
      noCandidates: expect.objectContaining({ primaryAction: '继续写作或运行检查' }),
      noChapters: expect.objectContaining({ primaryAction: '进入章节与写作' }),
      noTasks: expect.objectContaining({ primaryAction: '生成任务清单' })
    });
    expect(state.roles).toEqual([
      {
        id: 'author',
        label: '作者',
        description: '拥有故事最终确认权的人。',
        canComment: true,
        canSubmitCandidates: true,
        canConfirmHighImpactChanges: true,
        canWriteProjectFiles: true,
        canReviewCanon: true
      },
      {
        id: 'editor',
        label: '编辑',
        description: '协助整理草稿、候选和修改建议。',
        canComment: true,
        canSubmitCandidates: true,
        canConfirmHighImpactChanges: false,
        canWriteProjectFiles: true,
        canReviewCanon: true
      },
      {
        id: 'reviewer',
        label: '审稿者',
        description: '审阅文本、正典一致性和风险提示。',
        canComment: true,
        canSubmitCandidates: true,
        canConfirmHighImpactChanges: false,
        canWriteProjectFiles: false,
        canReviewCanon: true
      },
      {
        id: 'viewer',
        label: '只读成员',
        description: '只能查看当前状态和已公开内容。',
        canComment: false,
        canSubmitCandidates: false,
        canConfirmHighImpactChanges: false,
        canWriteProjectFiles: false,
        canReviewCanon: false
      },
      {
        id: 'agent',
        label: 'Agent',
        description: '根据作者边界生成候选、预览和任务建议。',
        canComment: true,
        canSubmitCandidates: true,
        canConfirmHighImpactChanges: false,
        canWriteProjectFiles: true,
        canReviewCanon: false
      }
    ]);
  });
});
