import path from 'node:path';
import type { ProjectFileSystem } from '../../application/project-ports.js';
import { inspectScenes } from '../../application/inspect-story-structure.js';
import { inspectCanon, inspectWorld } from '../../application/inspect-worldbuilding.js';
import type { SceneCard } from '../../domain/story-structure.js';
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
  | 'COMMON_CHARACTER_SUBSTITUTION'
  | 'WORLD_DENSITY_HIGH'
  | 'REVEAL_PACING_GAP'
  | 'FORESHADOWING_OPEN_LOOP';

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
  maxSceneWorldReferences?: number;
}

interface TimelineEventLike {
  chapter?: unknown;
}

interface CharacterSubstitutionLike {
  wrong?: unknown;
  correct?: unknown;
  context?: unknown;
}

interface SceneSource {
  scene: SceneCard;
  path: string;
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

const collectSceneSources = async (
  projectRoot: string,
  fileSystem: ProjectFileSystem
): Promise<SceneSource[]> => {
  const sceneResult = await inspectScenes({ projectRoot, fileSystem });
  return sceneResult.scenes.map(scene => ({
    scene,
    path: sceneResult.sceneSources.find(source => source.sceneId === scene.id)?.path
      ?? path.join(projectRoot, 'stories', '*', 'scenes', `${scene.id}.yaml`)
  }));
};

const collectWorldbuildingSignals = async (
  projectRoot: string,
  fileSystem: ProjectFileSystem
): Promise<string[]> => {
  const [world, canon] = await Promise.all([
    inspectWorld({ projectRoot, fileSystem }),
    inspectCanon({ projectRoot, fileSystem })
  ]);

  return [
    ...world.facts.flatMap(fact => [fact.id, fact.title]),
    ...canon.facts.map(fact => fact.id)
  ].filter(isNonEmptyString);
};

const createChapterQualityFallbackIssues = async (
  projectRoot: string,
  fileSystem: ProjectFileSystem,
  artifactScan: ArtifactScanResult,
  maxSceneWorldReferences: number
): Promise<WritingRuleIssue[]> => {
  const signals = await collectWorldbuildingSignals(projectRoot, fileSystem);
  if (signals.length === 0) {
    return [];
  }

  const issues: WritingRuleIssue[] = [];
  for (const story of artifactScan.stories) {
    for (const chapterPath of collectChapterArtifacts(story)) {
      const content = await fileSystem.readFile(chapterPath);
      const referencedSignals = signals.filter(signal => content.includes(signal));
      if (referencedSignals.length === 0) {
        continue;
      }

      if (referencedSignals.length > maxSceneWorldReferences) {
        issues.push(issue(
          'WORLD_DENSITY_HIGH',
          chapterPath,
          `章节正文显式引用 ${referencedSignals.length} 条 world/canon 信号；缺少 Scene Card 时建议补章节级揭示节奏记录`
        ));
      }

      issues.push(issue(
        'REVEAL_PACING_GAP',
        chapterPath,
        '章节正文引用了 world/canon 信号但没有 Scene Card reveals，建议补卡或在分析报告中记录读者可见信息',
        'info'
      ));
    }
  }

  return issues;
};

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

const createSceneQualityRule = (maxSceneWorldReferences: number): WritingRule => ({
  id: 'scene-quality',
  description: '检查 Scene Card 的世界观密度、揭示节奏和伏笔闭环',
  run: async ({ projectRoot, fileSystem, artifactScan }) => {
    const sceneSources = await collectSceneSources(projectRoot, fileSystem);
    const issues: WritingRuleIssue[] = [];

    if (sceneSources.length === 0) {
      return createChapterQualityFallbackIssues(projectRoot, fileSystem, artifactScan, maxSceneWorldReferences);
    }

    for (const { scene, path: scenePath } of sceneSources) {
      const worldReferenceCount = scene.worldElements.length + scene.canonFacts.length;
      if (worldReferenceCount > maxSceneWorldReferences) {
        issues.push(issue(
          'WORLD_DENSITY_HIGH',
          `${scenePath}#${scene.id}.worldElements`,
          `场景 ${scene.id} 承载 ${worldReferenceCount} 条 world/canon 引用，建议拆分揭示或减少解释密度`
        ));
      }

      if (worldReferenceCount > 0 && scene.reveals.length === 0) {
        issues.push(issue(
          'REVEAL_PACING_GAP',
          `${scenePath}#${scene.id}.reveals`,
          `场景 ${scene.id} 使用 world/canon 引用但没有声明 reveals，读者可见信息节奏不清晰`,
          'info'
        ));
      }

      if (
        scene.foreshadowing.planted.length > 0
        && scene.foreshadowing.paidOff.length === 0
        && scene.foreshadowing.plannedPayoff.length === 0
      ) {
        issues.push(issue(
          'FORESHADOWING_OPEN_LOOP',
          `${scenePath}#${scene.id}.foreshadowing`,
          `场景 ${scene.id} 埋下 ${scene.foreshadowing.planted.length} 个伏笔但没有回收记录，请确认后续回收任务`,
          'info'
        ));
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
  createCharacterWordingRule(),
  createSceneQualityRule(options.maxSceneWorldReferences ?? 4)
];

export const runWritingRules = async (input: RunWritingRulesInput): Promise<WritingRulesResult> => {
  const issues = (await Promise.all(input.rules.map(rule => rule.run(input))))
    .flat()
    .sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));

  return { issues };
};
