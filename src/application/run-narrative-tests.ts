import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { inspectScenes } from './inspect-story-structure.js';
import type { SceneCard } from '../domain/story-structure.js';
import type { NarrativeTestResult } from '../domain/workbench.js';
import type { WritingTask } from '../domain/story-artifact.js';
import {
  relativePath,
  selectStoryProject,
  toPosixPath,
  unique
} from './workbench-utils.js';

export interface RunNarrativeTestsInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter?: string;
  scene?: string;
}

export interface NarrativeTestReport {
  projectRoot: string;
  story: string;
  results: NarrativeTestResult[];
  summary: {
    pass: number;
    warning: number;
    fail: number;
  };
}

const normalizeChapter = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `chapter-${trimmed.padStart(3, '0')}` : trimmed;
};

const chapterFromTask = (task: WritingTask): string | undefined => {
  const values = [
    ...task.outputs,
    ...task.allowedWrites
  ].join('\n');
  const match = values.match(/chapter[-_]?(\d{1,4})/i);
  return match ? `chapter-${match[1].padStart(3, '0')}` : undefined;
};

const result = (
  data: Omit<NarrativeTestResult, 'status'>
    & { status?: NarrativeTestResult['status'] }
): NarrativeTestResult => ({
  status: data.severity === 'error' ? 'fail' : data.severity === 'warning' ? 'warning' : 'pass',
  ...data
});

const scenePath = (projectRoot: string, sourcePath: string): string =>
  relativePath(projectRoot, sourcePath);

const testScene = (
  projectRoot: string,
  scene: SceneCard,
  sourcePath: string
): NarrativeTestResult[] => {
  const pathValue = scenePath(projectRoot, sourcePath);
  const issues: NarrativeTestResult[] = [];

  if (!scene.sceneGoal.trim() || !scene.conflict.trim() || !scene.outcome.trim()) {
    issues.push(result({
      id: `scene-${scene.id}-gco`,
      severity: 'warning',
      path: pathValue,
      evidence: scene.id,
      message: 'Scene Card 需要明确 goal/conflict/outcome。',
      suggestedAction: '补齐 sceneGoal、conflict、outcome，再进入正文写作。'
    }));
  }

  if (scene.reveals.length === 0 && scene.worldElements.length > 0) {
    issues.push(result({
      id: `scene-${scene.id}-reveal`,
      severity: 'warning',
      path: pathValue,
      evidence: scene.worldElements.join(', '),
      message: '场景引用了世界观元素，但没有声明 reveals。',
      suggestedAction: '把本场景向读者揭示的信息写入 reveals，避免设定只被使用没有被交代。'
    }));
  }

  if (scene.foreshadowing.planted.length > 0 && scene.foreshadowing.paidOff.length === 0) {
    issues.push(result({
      id: `scene-${scene.id}-promise`,
      severity: 'info',
      path: pathValue,
      evidence: scene.foreshadowing.planted.join(', '),
      message: '场景埋下伏笔但没有回收项。',
      suggestedAction: '确认后续任务或 Scene Card 中存在 payoff 计划。'
    }));
  }

  if (issues.length === 0) {
    issues.push(result({
      id: `scene-${scene.id}-basic-pass`,
      severity: 'info',
      status: 'pass',
      path: pathValue,
      evidence: `${scene.sceneGoal} / ${scene.conflict} / ${scene.outcome}`,
      message: 'Scene Card 的基础叙事闭环已具备。',
      suggestedAction: '按该 Scene Card 起草或复核正文。'
    }));
  }

  return issues;
};

const taskFallbackResults = (
  projectRoot: string,
  tasks: WritingTask[],
  chapter?: string
): NarrativeTestResult[] => {
  const selected = chapter
    ? tasks.filter(task => chapterFromTask(task) === chapter)
    : tasks.filter(task => task.status === 'todo').slice(0, 3);

  if (selected.length === 0) {
    return [result({
      id: 'chapter-task-missing',
      severity: 'warning',
      path: toPosixPath(path.join(projectRoot, 'stories')),
      message: '没有找到可用于章节级 fallback 的任务。',
      suggestedAction: '补齐 tasks.md 的章节输出、验收标准和写作边界。'
    })];
  }

  return selected.flatMap(task => {
    const issues: NarrativeTestResult[] = [];
    const pathValue = relativePath(projectRoot, task.tasksPath);
    if (task.acceptanceCriteria.length === 0) {
      issues.push(result({
        id: `task-${task.id}-acceptance`,
        severity: 'warning',
        path: pathValue,
        evidence: task.id,
        message: '章节任务缺少验收标准，难以判断叙事目标是否达成。',
        suggestedAction: '补齐本章主角行动、冲突、结尾钩子或质量验收标准。'
      }));
    }

    if (!task.writeReady) {
      issues.push(result({
        id: `task-${task.id}-write-ready`,
        severity: 'warning',
        path: pathValue,
        evidence: task.title,
        message: '章节任务未标记 WRITE-READY。',
        suggestedAction: '写正文前补齐必须读取、允许修改、输出和验收标准。'
      }));
    }

    if (issues.length === 0) {
      issues.push(result({
        id: `task-${task.id}-fallback-pass`,
        severity: 'info',
        status: 'pass',
        path: pathValue,
        evidence: task.acceptanceCriteria.join('; '),
        message: '章节任务具备基础叙事验收条件。',
        suggestedAction: '没有 Scene Card 时，可先按该任务进行章节级写作。'
      }));
    }

    return issues;
  });
};

export const runNarrativeTests = async (
  input: RunNarrativeTestsInput
): Promise<NarrativeTestReport> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const chapter = normalizeChapter(input.chapter);
  const scenes = await inspectScenes({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: story.name
  });
  const sourceByScene = new Map(scenes.sceneSources.map(source => [source.sceneId, source.path]));
  const selectedScenes = scenes.scenes.filter(scene =>
    (!chapter || scene.chapter === chapter)
    && (!input.scene || scene.id === input.scene)
  );
  const results = selectedScenes.length > 0
    ? selectedScenes.flatMap(scene =>
      testScene(input.projectRoot, scene, sourceByScene.get(scene.id) ?? story.path)
    )
    : taskFallbackResults(input.projectRoot, story.tasks, chapter);
  const uniqueResults = unique(results);

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    results: uniqueResults,
    summary: {
      pass: uniqueResults.filter(item => item.status === 'pass').length,
      warning: uniqueResults.filter(item => item.status === 'warning').length,
      fail: uniqueResults.filter(item => item.status === 'fail').length
    }
  };
};

export const renderNarrativeTestReport = (report: NarrativeTestReport): string => [
  'Narrative Tests',
  '',
  `故事：${report.story}`,
  `结果：${report.summary.pass} pass / ${report.summary.warning} warning / ${report.summary.fail} fail`,
  '',
  ...report.results.map(item =>
    `- [${item.status}] ${item.id}: ${item.path} - ${item.message}；建议：${item.suggestedAction}`
  )
].join('\n').trimEnd();
