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
  description: string;
  primaryAction: string;
  route: `#${CompleteAppPageId}`;
  enabled: boolean;
}

export interface CompleteAppStatusLanguageEntry {
  term: 'candidate' | 'preview' | 'dry-run' | 'apply' | 'blocked' | 'deferred' | 'canon' | 'draft' | 'comment';
  label: string;
  meaning: string;
  primaryAction: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CompleteAppWriteModeLanguageEntry {
  term: ProjectResumeWriteMode;
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
  canWriteProjectFiles: boolean;
  canReviewCanon: boolean;
}

export interface CompleteAppMetricSummary {
  pendingConfirmations: number;
  blockers: number;
  agentCandidates: number;
  chapterFiles: number;
  contentFiles: number;
  contentChars: number;
}

export interface CompleteAppCockpitState {
  storyName: string;
  stageLabel: string;
  currentBlocker: string;
  primaryAction: ProjectResumeAction;
  metrics: CompleteAppMetricSummary;
  boundaries: string[];
  creativeGaps: string[];
  nextQuestions: string[];
}

export interface CompleteAppRailItem {
  id: string;
  label: string;
  value: string;
  tone: 'info' | 'attention' | 'success' | 'neutral';
}

export interface CompleteAppEmptyState {
  title: string;
  body: string;
  primaryAction: string;
}

export interface CompleteAppState {
  currentPage: CompleteAppPageId;
  project: {
    opened: boolean;
    name: string;
    root?: string;
  };
  pages: CompleteAppPage[];
  cockpit: CompleteAppCockpitState;
  collaborationRail: {
    items: CompleteAppRailItem[];
  };
  emptyStates: {
    noProject: CompleteAppEmptyState;
    noStory: CompleteAppEmptyState;
    noCandidates: CompleteAppEmptyState;
    noChapters: CompleteAppEmptyState;
    noTasks: CompleteAppEmptyState;
  };
  roles: CompleteAppRoleCapability[];
  statusLanguage: CompleteAppStatusLanguageEntry[];
  writeModeLanguage: CompleteAppWriteModeLanguageEntry[];
}

export const COMPLETE_APP_STATUS_LANGUAGE: CompleteAppStatusLanguageEntry[] = [
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
];

export const COMPLETE_APP_WRITE_MODE_LANGUAGE: CompleteAppWriteModeLanguageEntry[] = [
  {
    term: 'candidate',
    label: '候选',
    meaning: '候选写入模式只产出可比较的建议，确认前不改变正式故事。',
    primaryAction: '提交为候选方案',
    riskLevel: 'low'
  },
  {
    term: 'preview',
    label: '预览',
    meaning: '预览模式展示将要写入或覆盖的内容，供作者检查。',
    primaryAction: '查看预览变更',
    riskLevel: 'medium'
  },
  {
    term: 'apply',
    label: '应用',
    meaning: '应用模式会把作者已确认的内容写入正式故事文件。',
    primaryAction: '应用到正式故事',
    riskLevel: 'high'
  },
  {
    term: 'dry-run',
    label: '试运行',
    meaning: '试运行只模拟执行结果，不写入项目文件。',
    primaryAction: '检查执行计划',
    riskLevel: 'low'
  },
  {
    term: 'blocked',
    label: '阻塞',
    meaning: '阻塞模式表示当前缺少必要输入或存在风险，不能继续写入。',
    primaryAction: '处理阻塞原因',
    riskLevel: 'high'
  },
  {
    term: 'read-only',
    label: '只读',
    meaning: '只读取或导航当前项目状态，不写入故事文件。',
    primaryAction: '查看状态',
    riskLevel: 'low'
  }
];

export const COMPLETE_APP_ROLES: CompleteAppRoleCapability[] = [
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
];

export const COMPLETE_APP_PAGES: CompleteAppPage[] = [
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
];

const EMPTY_STATES: CompleteAppState['emptyStates'] = {
  noProject: {
    title: '尚未打开项目',
    body: '选择一个 StorySpec 项目后，App 会显示故事阶段、下一步动作和创作边界。',
    primaryAction: '打开已有项目'
  },
  noStory: {
    title: '尚未创建故事',
    body: '先保存一句灵感，后续再逐步澄清人物、设定和冲突。',
    primaryAction: '保存一句灵感'
  },
  noCandidates: {
    title: '暂无候选',
    body: '继续写作或运行检查后，可在这里比较待确认建议。',
    primaryAction: '继续写作或运行检查'
  },
  noChapters: {
    title: '暂无章节',
    body: '进入章节与写作后，可以从下一项任务生成上下文包。',
    primaryAction: '进入章节与写作'
  },
  noTasks: {
    title: '暂无任务',
    body: '创作计划确认后，生成任务清单再推进章节写作。',
    primaryAction: '生成任务清单'
  }
};

const noProjectPrimaryAction: ProjectResumeAction = {
  label: '打开已有项目',
  reason: '尚未选择 StorySpec 项目。',
  copyableCommand: '',
  writesFiles: false,
  writeMode: 'read-only',
  boundary: '打开项目只读取本机状态，不写入故事文件。'
};

const emptyMetrics = (): CompleteAppMetricSummary => ({
  pendingConfirmations: 0,
  blockers: 0,
  agentCandidates: 0,
  chapterFiles: 0,
  contentFiles: 0,
  contentChars: 0
});

const buildMetrics = (status?: ProjectStatus): CompleteAppMetricSummary => {
  if (!status?.story) {
    return {
      ...emptyMetrics(),
      blockers: status?.blockers.length ?? 0
    };
  }

  return {
    pendingConfirmations: status.story.creativeControl.pendingDecisions,
    blockers: status.blockers.length,
    agentCandidates: status.story.creativeControl.unconfirmedAiSuggestions,
    chapterFiles: status.story.chapterFiles,
    contentFiles: status.story.contentFiles,
    contentChars: status.story.contentChars
  };
};

const buildRailItems = (metrics: CompleteAppMetricSummary): CompleteAppRailItem[] => [
  {
    id: 'pending-confirmations',
    label: '待确认',
    value: String(metrics.pendingConfirmations),
    tone: metrics.pendingConfirmations > 0 ? 'attention' : 'neutral'
  },
  {
    id: 'blockers',
    label: '阻塞',
    value: String(metrics.blockers),
    tone: metrics.blockers > 0 ? 'attention' : 'neutral'
  },
  {
    id: 'agent-candidates',
    label: 'Agent 候选',
    value: String(metrics.agentCandidates),
    tone: metrics.agentCandidates > 0 ? 'attention' : 'neutral'
  }
];

const buildCurrentBlocker = (status: ProjectStatus | undefined, metrics: CompleteAppMetricSummary): string => {
  if (!status) {
    return '尚未打开项目。';
  }

  if (!status.story) {
    return '尚未创建故事。';
  }

  if (status.blockers.length > 0) {
    return status.blockers[0]?.message ?? '当前存在阻塞项。';
  }

  if (metrics.pendingConfirmations > 0) {
    return `还有 ${metrics.pendingConfirmations} 个创作决策待确认。`;
  }

  return '当前没有阻塞项。';
};

export const buildCompleteAppState = (status?: ProjectStatus): CompleteAppState => {
  const metrics = buildMetrics(status);
  const storyName = status?.story?.name ?? '尚未创建故事';
  const currentBlocker = buildCurrentBlocker(status, metrics);

  return {
    currentPage: status?.story ? 'story-cockpit' : 'workspace-entry',
    project: status
      ? {
          opened: true,
          name: status.projectName,
          root: status.projectRoot
        }
      : {
          opened: false,
          name: '尚未打开项目',
          root: undefined
        },
    pages: COMPLETE_APP_PAGES,
    cockpit: {
      storyName,
      stageLabel: status?.resume.stateLabel ?? '尚未打开项目',
      currentBlocker,
      primaryAction: status?.resume.primaryAction ?? noProjectPrimaryAction,
      metrics,
      boundaries: status?.resume.boundaries ?? ['不会绕过 preview / confirm / apply。'],
      creativeGaps: status?.story?.creativeGaps ?? [],
      nextQuestions: status?.story?.nextQuestions ?? []
    },
    collaborationRail: {
      items: buildRailItems(metrics)
    },
    emptyStates: EMPTY_STATES,
    roles: COMPLETE_APP_ROLES,
    statusLanguage: COMPLETE_APP_STATUS_LANGUAGE,
    writeModeLanguage: COMPLETE_APP_WRITE_MODE_LANGUAGE
  };
};
