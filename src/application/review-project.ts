import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { validateProject, type ProjectValidationIssue } from './validate-project.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import {
  createDefaultWritingRules,
  runWritingRules,
  type WritingRuleIssue
} from '../validation/rules/writing-rules.js';
import { inspectScenes } from './inspect-story-structure.js';
import type { ValidationSeverity } from '../validation/schema/index.js';
import { checkPromises } from './manage-promises.js';
import type { PromiseIssue } from '../domain/workbench.js';

export type ReviewerId = 'worldbuilding' | 'voice' | 'continuity' | 'editor' | 'reader' | (string & {});

export interface ReviewFinding {
  reviewerId: ReviewerId;
  severity: ValidationSeverity;
  code: string;
  path: string;
  evidence: string;
  message: string;
  suggestedAction: string;
}

export interface ReviewerReport {
  id: ReviewerId;
  title: string;
  score: number;
  findings: ReviewFinding[];
}

export interface ReviewTaskDraft {
  task_title: string;
  description: string;
  severity: ValidationSeverity;
  sourceFinding: string;
  suggestedAction: string;
}

export interface ReviewProjectResult {
  projectRoot: string;
  reviewers: ReviewerReport[];
  findings: ReviewFinding[];
  taskDrafts: ReviewTaskDraft[];
}

export interface ReviewProjectInput {
  projectRoot: string;
  packageRoot?: string;
  fileSystem: ProjectFileSystem;
  panel?: readonly string[];
  chapter?: string;
}

const REVIEWER_TITLES: Record<string, string> = {
  worldbuilding: '世界观审稿人',
  voice: '角色声音审稿人',
  continuity: '连续性审稿人',
  editor: '编辑审稿人',
  reader: '读者审稿人'
};

const DEFAULT_PANEL: ReviewerId[] = ['worldbuilding', 'voice', 'continuity', 'editor', 'reader'];

const relativePath = (projectRoot: string, filePath: string): string =>
  path.isAbsolute(filePath)
    ? path.relative(projectRoot, filePath).split(path.sep).join('/')
    : filePath.split(path.sep).join('/');

const classifyReviewer = (issue: ProjectValidationIssue | WritingRuleIssue | PromiseIssue): ReviewerId => {
  if (issue.code.includes('PROMISE') || issue.code.includes('TENSION')) {
    return 'reader';
  }

  if (
    issue.code.includes('WORLD')
    || issue.code.includes('CANON')
    || issue.code === 'REVEAL_PACING_GAP'
    || issue.code === 'WORLD_DENSITY_HIGH'
    || issue.code === 'FORESHADOWING_OPEN_LOOP'
  ) {
    return 'worldbuilding';
  }

  if (issue.code.includes('VOICE')) {
    return 'voice';
  }

  if (
    issue.code.includes('GRAPH')
    || issue.code.includes('SCENE')
    || issue.code.includes('TIMELINE')
    || issue.code.includes('TRACKING')
    || issue.code.includes('DEPENDENCY')
  ) {
    return 'continuity';
  }

  if (
    issue.code.includes('CHAPTER')
    || issue.code.includes('TASK')
    || issue.code.includes('TEMPLATE')
  ) {
    return 'editor';
  }

  if (issue.code.includes('CHARACTER')) {
    return 'voice';
  }

  return 'reader';
};

const suggestAction = (issue: ProjectValidationIssue | WritingRuleIssue | PromiseIssue): string => {
  if ('suggestedAction' in issue) {
    return issue.suggestedAction;
  }

  const actions: Record<string, string> = {
    WORLD_DENSITY_HIGH: '拆分 Scene Card 的设定承载，或把部分 world/canon 引用移到后续场景',
    REVEAL_PACING_GAP: '补充 reveals 字段，声明本场景对读者揭示了什么信息',
    FORESHADOWING_OPEN_LOOP: '新增后续回收任务，或把伏笔移动到已有回收场景',
    MISSING_VOICE_FIELD: '补齐 VoiceFingerprint 必填字段',
    MISSING_VOICE_SAMPLE: '补齐角色声音样本或修正 samplePaths',
    CHAPTER_TOO_SHORT: '补足场景行动、对话和情绪转折后再进入审稿',
    UNKNOWN_TASK_DEPENDENCY: '修正 tasks.md 的依赖任务 id',
    UNKNOWN_STORY_EDGE_ENTITY: '补齐 Entity Graph entity 或修正 edge 引用',
    UNKNOWN_SCENE_ENTITY: '补齐 Entity Graph entity 或修正 Scene Card 引用',
    MISSING_TASKS: '补齐 tasks.md，让审稿意见可以落到可执行任务',
    MISSING_SPECIFICATION: '补齐 specification.md，避免读者审稿缺少判断依据',
    MISSING_CREATIVE_PLAN: '补齐 creative-plan.md，避免结构审稿缺少判断依据',
    MISSING_TASK_OUTPUT: '补齐任务输出文件，或修正 tasks.md 中的输出路径'
  };

  return actions[issue.code] ?? '根据 finding 修正文档或补充任务，并重新运行 novel validate';
};

const toFinding = (
  projectRoot: string,
  issue: ProjectValidationIssue | WritingRuleIssue | PromiseIssue
): ReviewFinding => ({
  reviewerId: classifyReviewer(issue),
  severity: issue.severity,
  code: issue.code,
  path: relativePath(projectRoot, issue.path),
  evidence: 'evidence' in issue && issue.evidence ? issue.evidence : issue.message,
  message: issue.message,
  suggestedAction: suggestAction(issue)
});

const scoreReviewer = (findings: readonly ReviewFinding[]): number => {
  const penalty = findings.reduce((total, finding) => {
    if (finding.severity === 'error') {
      return total + 18;
    }

    if (finding.severity === 'warning') {
      return total + 8;
    }

    return total + 3;
  }, 0);

  return Math.max(0, 100 - penalty);
};

const createTaskDraft = (finding: ReviewFinding): ReviewTaskDraft => ({
  task_title: `[${finding.severity}] 修复 ${finding.code}`,
  description: `${finding.path}：${finding.message}`,
  severity: finding.severity,
  sourceFinding: `${finding.reviewerId}:${finding.code}`,
  suggestedAction: finding.suggestedAction
});

const normalizeChapter = (value: string): string => {
  const trimmed = value.trim();
  const numeric = trimmed.match(/^\d+$/);
  return numeric ? `chapter-${numeric[0].padStart(3, '0')}` : trimmed;
};

const collectChapterPaths = async (input: ReviewProjectInput): Promise<Set<string> | undefined> => {
  if (!input.chapter) {
    return undefined;
  }

  const chapter = normalizeChapter(input.chapter);
  const paths = new Set<string>();
  const scenes = await inspectScenes({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });

  scenes.sceneSources
    .filter(source => source.chapter === chapter)
    .forEach(source => paths.add(relativePath(input.projectRoot, source.path)));

  for (const story of (await scanStoryArtifacts({ projectRoot: input.projectRoot, fileSystem: input.fileSystem })).stories) {
    for (const artifact of story.artifacts) {
      if (artifact.kind === 'chapter' && artifact.exists && artifact.path.includes(`${chapter}.md`)) {
        paths.add(relativePath(input.projectRoot, artifact.path));
      }
    }
  }

  return paths;
};

const belongsToChapter = (finding: ReviewFinding, chapterPaths?: Set<string>): boolean => {
  if (!chapterPaths) {
    return true;
  }

  return [...chapterPaths].some(chapterPath => finding.path.startsWith(chapterPath));
};

export const reviewProject = async (input: ReviewProjectInput): Promise<ReviewProjectResult> => {
  const panel = new Set((input.panel && input.panel.length > 0 ? input.panel : DEFAULT_PANEL).map(id => id.trim()));
  const validation = await validateProject(input);
  const artifactScan = await scanStoryArtifacts({ projectRoot: input.projectRoot, fileSystem: input.fileSystem });
  const chapterPaths = await collectChapterPaths(input);
  const quality = await runWritingRules({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    artifactScan,
    rules: createDefaultWritingRules()
  });
  const promiseResult = await checkPromises({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });
  const rawFindings = [
    ...validation.issues.map(issue => toFinding(input.projectRoot, issue)),
    ...quality.issues
      .filter(issue => !validation.issues.some(existing => existing.code === issue.code && existing.path === issue.path))
      .map(issue => toFinding(input.projectRoot, issue)),
    ...promiseResult.issues.map(issue => toFinding(input.projectRoot, issue))
  ].filter(finding => panel.has(finding.reviewerId));
  const allFindings = rawFindings.filter(finding => belongsToChapter(finding, chapterPaths));

  const reviewers = [...panel].map(id => {
    const findings = allFindings.filter(finding => finding.reviewerId === id);
    return {
      id,
      title: REVIEWER_TITLES[id] ?? id,
      score: scoreReviewer(findings),
      findings
    };
  });

  return {
    projectRoot: input.projectRoot,
    reviewers,
    findings: allFindings,
    taskDrafts: allFindings.map(createTaskDraft)
  };
};

export const renderReviewReport = (result: ReviewProjectResult): string => [
  'Novel Writer 审稿面板',
  '',
  `根目录：${result.projectRoot}`,
  `Findings：${result.findings.length}`,
  `任务草稿：${result.taskDrafts.length}`,
  '',
  ...result.reviewers.flatMap(reviewer => [
    `## ${reviewer.title}（${reviewer.score}/100）`,
    ...(
      reviewer.findings.length > 0
        ? reviewer.findings.map(finding =>
          `- [${finding.severity}] ${finding.code}: ${finding.path} - ${finding.message}；建议：${finding.suggestedAction}`
        )
        : ['- 暂无 finding']
    ),
    ''
  ])
].join('\n').trimEnd();
