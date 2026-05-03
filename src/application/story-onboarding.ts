import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  relativePath,
  selectStoryProject,
  slugifyPathPart
} from './workbench-utils.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import {
  getStoryStageCreativeGaps,
  getStoryStageNextQuestions,
  type StoryMaturityStage
} from '../domain/story-stage.js';
import { summarizeCreativeControl } from './creative-control-summary.js';

export type StoryOnboardingErrorCode =
  | 'MISSING_STORY_NAME'
  | 'STORY_ALREADY_EXISTS'
  | 'NO_STORIES';

export class StoryOnboardingError extends Error {
  constructor(
    public readonly code: StoryOnboardingErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'StoryOnboardingError';
  }
}

export interface CreateStoryIdeaInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  name: string;
  idea?: string;
  now?: () => Date;
}

export interface CreateStoryIdeaResult {
  story: string;
  storyPath: string;
  ideaPath: string;
  idea: string;
  nextCommands: string[];
  markdown: string;
}

export interface GetStoryNextInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface StoryNextAction {
  priority: number;
  command: string;
  reason: string;
}

export interface StoryNextResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  stage: StoryMaturityStage;
  issues: string[];
  creativeGaps: string[];
  pendingQuestions: string[];
  actions: StoryNextAction[];
}

const normalizeStoryName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new StoryOnboardingError('MISSING_STORY_NAME', '请提供故事名称，例如：storyspec story:new 法术编译纪元');
  }

  return slugifyPathPart(trimmed);
};

const renderIdeaMarkdown = (
  story: string,
  idea: string,
  timestamp: string
): string => [
  `# ${story} 创意草稿`,
  '',
  `创建时间：${timestamp}`,
  '',
  '## 用户原文',
  '',
  idea || '（尚未记录一句话创意；请用 `storyspec interview` 补充。）',
  '',
  '## 待澄清',
  '',
  '- 主角是谁，开局最想要什么？',
  '- 故事从哪里开始，第一眼异界差异是什么？',
  '- 第一卷的核心冲突和失败代价是什么？',
  '',
  '## AI 候选建议',
  '',
  '- 暂无。AI 候选必须经过用户确认，才能进入 specification、tasks 或正文。',
  '',
  '## 下一步',
  '',
  `- 运行 \`storyspec interview ${story}\`，先回答澄清问题。`,
  `- 运行 \`storyspec next ${story}\`，随时查看当前下一步。`,
  ''
].join('\n');

export const createStoryIdea = async (
  input: CreateStoryIdeaInput
): Promise<CreateStoryIdeaResult> => {
  const story = normalizeStoryName(input.name);
  const storyPath = path.join(input.projectRoot, 'stories', story);
  const ideaPath = path.join(storyPath, 'idea.md');
  const idea = input.idea?.trim() ?? '';

  if (await input.fileSystem.pathExists(storyPath)) {
    throw new StoryOnboardingError(
      'STORY_ALREADY_EXISTS',
      `故事已存在：${story}。请换一个名称，或运行 storyspec next ${story} 继续现有故事。`
    );
  }

  const markdown = renderIdeaMarkdown(
    story,
    idea,
    (input.now ?? (() => new Date()))().toISOString()
  );
  await input.fileSystem.ensureDir(storyPath);
  await input.fileSystem.writeFile(ideaPath, markdown);

  return {
    story,
    storyPath,
    ideaPath,
    idea,
    nextCommands: [
      `storyspec interview ${story}`,
      `storyspec next ${story}`
    ],
    markdown
  };
};

const action = (priority: number, command: string, reason: string): StoryNextAction => ({
  priority,
  command,
  reason
});

const buildActions = (
  result: Omit<StoryNextResult, 'actions'>
): StoryNextAction[] => {
  const actions: StoryNextAction[] = [];

  if (result.stage === 'idea') {
    actions.push(action(1, `storyspec interview ${result.story}`, '先把一句话创意转成澄清记录，不急着生成完整设定。'));
    actions.push(action(2, `storyspec creative:report ${result.story}`, '查看哪些内容仍不能被当作正典。'));
    actions.push(action(3, `storyspec preview specify ${result.story}`, '生成写入前规格预览，确认后再 apply。'));
    return actions;
  }

  if (result.pendingQuestions.length > 0) {
    actions.push(action(1, `storyspec interview ${result.story}`, '继续回答 required 问题或处理 AI 候选。'));
  }

  if (result.stage === 'interviewing') {
    actions.push(action(2, `storyspec preview specify ${result.story}`, '用已确认答案生成规格预览，不直接覆盖 specification。'));
    actions.push(action(3, `storyspec creative:report ${result.story}`, '检查用户确认、AI 候选和漂移风险。'));
  } else if (result.stage === 'specified') {
    actions.push(action(1, `storyspec review --panel continuity`, '检查规格是否引用未确认建议或待澄清主题。'));
    actions.push(action(2, '继续运行平台对应 plan 命令', '规格已存在，下一步应生成创作计划。'));
  } else if (result.stage === 'planned') {
    actions.push(action(1, '继续运行平台对应 tasks 命令', '创作计划已存在，下一步应拆成可执行任务。'));
  } else if (result.stage === 'tasked') {
    actions.push(action(1, `storyspec context:pack ${result.story}`, '任务已存在，先生成上下文包再写作。'));
    actions.push(action(2, `storyspec review ${result.story}`, '开始写作前做一次 reviewer loop。'));
  } else {
    actions.push(action(1, `storyspec review ${result.story}`, '已有正文，优先复核连续性、风格和创作控制权。'));
    actions.push(action(2, `storyspec validate`, '确认项目结构和写作产物仍可通过校验。'));
  }

  if (actions.length === 0) {
    actions.push(action(1, `storyspec interview ${result.story}`, '当前状态不完整，先回到澄清访谈。'));
  }

  return actions.sort((left, right) =>
    left.priority - right.priority
    || left.command.localeCompare(right.command)
  ).slice(0, 4);
};

export const getStoryNext = async (
  input: GetStoryNextInput
): Promise<StoryNextResult> => {
  const scan = await scanStoryArtifacts({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });

  if (scan.stories.length === 0) {
    throw new StoryOnboardingError(
      'NO_STORIES',
      '项目中还没有故事。请先运行 storyspec story:new <name> --idea "一句话创意"。'
    );
  }

  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const creativeControl = await summarizeCreativeControl({
    projectRoot: input.projectRoot,
    storyPath: story.path,
    fileSystem: input.fileSystem,
    fallbackNextQuestions: getStoryStageNextQuestions(story.stage)
  });
  const base = {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    stage: story.stage,
    issues: story.issues.map(issue => `${issue.code}: ${relativePath(input.projectRoot, issue.path)} - ${issue.message}`),
    creativeGaps: getStoryStageCreativeGaps(story.stage),
    pendingQuestions: [
      ...creativeControl.pendingQuestions,
      ...creativeControl.cannotFinalize.filter(item => item.startsWith('AI 建议待确认'))
    ]
  };

  return {
    ...base,
    actions: buildActions(base)
  };
};

export const renderCreateStoryIdea = (result: CreateStoryIdeaResult): string => [
  'StorySpec 新故事',
  '',
  `故事：${result.story}`,
  `创意草稿：${result.ideaPath}`,
  '',
  '下一步：',
  ...result.nextCommands.map(command => `- ${command}`),
  '',
  '提示：这里只记录用户原文和待澄清问题，不会自动扩写完整设定。'
].join('\n');

export const renderStoryNext = (result: StoryNextResult): string => [
  'StorySpec 下一步导航',
  '',
  `故事：${result.story}`,
  `阶段：${result.stage}`,
  '',
  '建议动作：',
  ...result.actions.map(item => `- ${item.command}：${item.reason}`),
  '',
  '创作缺口：',
  ...(result.creativeGaps.length > 0 ? result.creativeGaps.map(item => `- ${item}`) : ['- 暂无明显缺口。']),
  '',
  '待确认：',
  ...(result.pendingQuestions.length > 0 ? result.pendingQuestions.map(item => `- ${item}`) : ['- 暂无 required 待确认项。']),
  '',
  '结构问题：',
  ...(result.issues.length > 0 ? result.issues.map(item => `- ${item}`) : ['- 暂无。'])
].join('\n');
