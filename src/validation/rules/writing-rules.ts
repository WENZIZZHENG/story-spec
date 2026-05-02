import path from 'node:path';
import type { ProjectFileSystem } from '../../application/project-ports.js';
import type {
  ArtifactScanResult,
  ScannedStoryProject
} from '../artifact-scanner.js';
import type { ValidationSeverity } from '../schema/index.js';

export type WritingRuleIssueCode =
  | 'UNKNOWN_TASK_DEPENDENCY'
  | 'CHAPTER_TOO_SHORT'
  | 'TIMELINE_CHAPTER_ORDER'
  | 'FORBIDDEN_CHARACTER_ADDRESS'
  | 'COMMON_CHARACTER_SUBSTITUTION';

export interface WritingRuleIssue {
  severity: ValidationSeverity;
  code: WritingRuleIssueCode;
  path: string;
  message: string;
}

export interface WritingRuleContext {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  artifactScan: ArtifactScanResult;
}

export interface WritingRule {
  id: string;
  description: string;
  run(context: WritingRuleContext): Promise<WritingRuleIssue[]>;
}

export interface RunWritingRulesInput extends WritingRuleContext {
  rules: readonly WritingRule[];
}

export interface WritingRulesResult {
  issues: WritingRuleIssue[];
}

export interface DefaultWritingRulesOptions {
  minChapterChars?: number;
}

interface TimelineEventLike {
  chapter?: unknown;
}

interface CharacterSubstitutionLike {
  wrong?: unknown;
  correct?: unknown;
  context?: unknown;
}

const issue = (
  code: WritingRuleIssueCode,
  filePath: string,
  message: string,
  severity: ValidationSeverity = 'warning'
): WritingRuleIssue => ({
  severity,
  code,
  path: filePath,
  message
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeContentLength = (content: string): number => content
  .replace(/```[\s\S]*?```/g, '')
  .replace(/[#>*_`\-[\]()]/g, '')
  .replace(/\s+/g, '')
  .length;

const readJsonSafe = async (fs: ProjectFileSystem, filePath: string): Promise<unknown> => {
  try {
    return JSON.parse(await fs.readFile(filePath));
  } catch {
    return null;
  }
};

const collectChapterArtifacts = (story: ScannedStoryProject): string[] => story.artifacts
  .filter(artifact => artifact.kind === 'chapter' && artifact.exists)
  .map(artifact => artifact.path)
  .sort();

const createTaskDependencyRule = (): WritingRule => ({
  id: 'task-dependencies',
  description: '检查任务依赖是否指向同一故事内存在的任务',
  run: async ({ artifactScan }) => {
    const issues: WritingRuleIssue[] = [];

    for (const story of artifactScan.stories) {
      const taskIds = new Set(story.tasks.map(task => task.id));
      for (const task of story.tasks) {
        for (const dependency of task.dependencies) {
          if (!taskIds.has(dependency)) {
            issues.push(issue(
              'UNKNOWN_TASK_DEPENDENCY',
              `${task.tasksPath}#${task.id}`,
              `任务 ${task.id} 依赖不存在的任务：${dependency}`,
              'error'
            ));
          }
        }
      }
    }

    return issues;
  }
});

const createChapterLengthRule = (minChapterChars: number): WritingRule => ({
  id: 'chapter-length',
  description: '检查章节正文是否低于最小字数',
  run: async ({ fileSystem, artifactScan }) => {
    const issues: WritingRuleIssue[] = [];

    for (const story of artifactScan.stories) {
      for (const chapterPath of collectChapterArtifacts(story)) {
        const chars = normalizeContentLength(await fileSystem.readFile(chapterPath));
        if (chars < minChapterChars) {
          issues.push(issue(
            'CHAPTER_TOO_SHORT',
            chapterPath,
            `章节正文过短：${chars}/${minChapterChars} 字符`
          ));
        }
      }
    }

    return issues;
  }
});

const createTimelineRule = (): WritingRule => ({
  id: 'timeline-order',
  description: '检查 timeline events 的 chapter 顺序是否回退',
  run: async ({ projectRoot, fileSystem }) => {
    const timelinePath = path.join(projectRoot, 'spec', 'tracking', 'timeline.json');
    if (!await fileSystem.pathExists(timelinePath)) {
      return [];
    }

    const document = await readJsonSafe(fileSystem, timelinePath);
    if (!isRecord(document) || !Array.isArray(document.events)) {
      return [];
    }

    const issues: WritingRuleIssue[] = [];
    let previousChapter = -Infinity;
    document.events.forEach((event: TimelineEventLike, index) => {
      const chapter = Number(event.chapter);
      if (!Number.isFinite(chapter)) {
        return;
      }

      if (chapter < previousChapter) {
        issues.push(issue(
          'TIMELINE_CHAPTER_ORDER',
          `${timelinePath}#events[${index}]`,
          `时间线事件章节回退：${chapter} 小于前序 ${previousChapter}`
        ));
      }

      previousChapter = Math.max(previousChapter, chapter);
    });

    return issues;
  }
});

const collectForbiddenCharacterTerms = (document: unknown): string[] => {
  if (!isRecord(document) || !isRecord(document.characters) || !isRecord(document.characters.protagonist)) {
    return [];
  }

  const forbidden = document.characters.protagonist.forbidden;
  if (!Array.isArray(forbidden)) {
    return [];
  }

  return forbidden.filter(isNonEmptyString);
};

const collectCharacterSubstitutions = (document: unknown): CharacterSubstitutionLike[] => {
  if (!isRecord(document) || !isRecord(document.common_errors)) {
    return [];
  }

  const substitutions = document.common_errors.character_substitution;
  if (!Array.isArray(substitutions)) {
    return [];
  }

  return substitutions.filter(isRecord);
};

const createCharacterWordingRule = (): WritingRule => ({
  id: 'character-wording',
  description: '检查正文中的禁用称呼和常见角色误名',
  run: async ({ projectRoot, fileSystem, artifactScan }) => {
    const rulesPath = path.join(projectRoot, 'spec', 'tracking', 'validation-rules.json');
    if (!await fileSystem.pathExists(rulesPath)) {
      return [];
    }

    const document = await readJsonSafe(fileSystem, rulesPath);
    const forbiddenTerms = collectForbiddenCharacterTerms(document);
    const substitutions = collectCharacterSubstitutions(document);
    const issues: WritingRuleIssue[] = [];

    for (const story of artifactScan.stories) {
      for (const chapterPath of collectChapterArtifacts(story)) {
        const content = await fileSystem.readFile(chapterPath);
        for (const term of forbiddenTerms) {
          if (content.includes(term)) {
            issues.push(issue(
              'FORBIDDEN_CHARACTER_ADDRESS',
              chapterPath,
              `正文出现禁用角色称呼：${term}`
            ));
          }
        }

        for (const substitution of substitutions) {
          if (isNonEmptyString(substitution.wrong) && content.includes(substitution.wrong)) {
            const correct = isNonEmptyString(substitution.correct) ? `，建议：${substitution.correct}` : '';
            issues.push(issue(
              'COMMON_CHARACTER_SUBSTITUTION',
              chapterPath,
              `正文出现常见角色误名：${substitution.wrong}${correct}`
            ));
          }
        }
      }
    }

    return issues;
  }
});

export const createDefaultWritingRules = (
  options: DefaultWritingRulesOptions = {}
): WritingRule[] => [
  createTaskDependencyRule(),
  createChapterLengthRule(options.minChapterChars ?? 500),
  createTimelineRule(),
  createCharacterWordingRule()
];

export const runWritingRules = async (input: RunWritingRulesInput): Promise<WritingRulesResult> => {
  const issues = (await Promise.all(input.rules.map(rule => rule.run(input))))
    .flat()
    .sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));

  return { issues };
};
