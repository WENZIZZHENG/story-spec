import path from 'node:path';
import fsExtra from 'fs-extra';
import type { ProjectFileSystem } from '../application/project-ports.js';
import {
  parseWritingTasksFromMarkdown,
  type StoryArtifact,
  type StoryProject,
  type WritingTask
} from '../domain/story-artifact.js';

export type ArtifactIssueSeverity = 'error' | 'warning' | 'info';

export interface ArtifactIssue {
  severity: ArtifactIssueSeverity;
  code:
    | 'MISSING_SPECIFICATION'
    | 'MISSING_CREATIVE_PLAN'
    | 'MISSING_TASKS'
    | 'MISSING_TASK_OUTPUT'
    | 'INVALID_TRACKING_JSON';
  message: string;
  path: string;
}

export interface TrackingArtifact {
  file: string;
  path: string;
  valid: boolean;
  error?: string;
}

export interface ScannedStoryProject extends StoryProject {
  issues: ArtifactIssue[];
}

export interface ArtifactScanResult {
  projectRoot: string;
  stories: ScannedStoryProject[];
  tracking: TrackingArtifact[];
  issues: ArtifactIssue[];
}

export interface ScanStoryArtifactsInput {
  projectRoot: string;
  fileSystem?: ProjectFileSystem;
}

const nodeFileSystem = {
  pathExists: (filePath: string) => fsExtra.pathExists(filePath),
  readDir: (dirPath: string) => fsExtra.readdir(dirPath),
  readFile: (filePath: string) => fsExtra.readFile(filePath, 'utf-8'),
  stat: (filePath: string) => fsExtra.stat(filePath)
} as Pick<ProjectFileSystem, 'pathExists' | 'readDir' | 'readFile' | 'stat'>;

const artifactExists = async (
  fs: Pick<ProjectFileSystem, 'pathExists'>,
  kind: StoryArtifact['kind'],
  filePath: string
): Promise<StoryArtifact> => ({
  kind,
  path: filePath,
  exists: await fs.pathExists(filePath)
});

const listDirectories = async (
  fs: Pick<ProjectFileSystem, 'pathExists' | 'readDir' | 'stat'>,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const entries = await fs.readDir(dirPath);
  const dirs: string[] = [];
  for (const entry of entries) {
    if ((await fs.stat(path.join(dirPath, entry))).isDirectory()) {
      dirs.push(entry);
    }
  }

  return dirs.sort();
};

const listMarkdownFiles = async (
  fs: Pick<ProjectFileSystem, 'pathExists' | 'readDir' | 'stat'>,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const entries = await fs.readDir(dirPath);
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listMarkdownFiles(fs, entryPath));
    } else if (stat.isFile() && entry.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files.sort();
};

const createMissingIssue = (
  code: ArtifactIssue['code'],
  message: string,
  filePath: string
): ArtifactIssue => ({
  severity: 'warning',
  code,
  message,
  path: filePath
});

const readTasks = async (
  fs: Pick<ProjectFileSystem, 'pathExists' | 'readFile'>,
  storyPath: string,
  tasksPath: string
): Promise<WritingTask[]> => {
  if (!await fs.pathExists(tasksPath)) {
    return [];
  }

  return parseWritingTasksFromMarkdown(await fs.readFile(tasksPath), {
    storyPath,
    tasksPath
  });
};

const scanStory = async (
  fs: Pick<ProjectFileSystem, 'pathExists' | 'readDir' | 'readFile' | 'stat'>,
  projectRoot: string,
  storyName: string
): Promise<ScannedStoryProject> => {
  const storyPath = path.join(projectRoot, 'stories', storyName);
  const specificationPath = path.join(storyPath, 'specification.md');
  const creativePlanPath = path.join(storyPath, 'creative-plan.md');
  const tasksPath = path.join(storyPath, 'tasks.md');
  const contentDir = path.join(storyPath, 'content');
  const tasks = await readTasks(fs, storyPath, tasksPath);
  const contentFiles = await listMarkdownFiles(fs, contentDir);
  const artifacts: StoryArtifact[] = [
    await artifactExists(fs, 'specification', specificationPath),
    await artifactExists(fs, 'creative-plan', creativePlanPath),
    await artifactExists(fs, 'tasks', tasksPath),
    ...contentFiles.map(filePath => ({
      kind: 'chapter' as const,
      path: filePath,
      exists: true
    }))
  ];
  const issues: ArtifactIssue[] = [];

  if (!await fs.pathExists(specificationPath)) {
    issues.push(createMissingIssue('MISSING_SPECIFICATION', '缺少故事规格文件: specification.md', specificationPath));
  }

  if (!await fs.pathExists(creativePlanPath)) {
    issues.push(createMissingIssue('MISSING_CREATIVE_PLAN', '缺少创作计划文件: creative-plan.md', creativePlanPath));
  }

  if (!await fs.pathExists(tasksPath)) {
    issues.push(createMissingIssue('MISSING_TASKS', '缺少任务清单文件: tasks.md', tasksPath));
  }

  for (const task of tasks) {
    for (const output of task.outputs) {
      const outputPath = path.join(storyPath, output);
      if (!await fs.pathExists(outputPath)) {
        issues.push(createMissingIssue(
          'MISSING_TASK_OUTPUT',
          `任务 ${task.id} 的输出文件不存在: ${output}`,
          outputPath
        ));
      }
    }
  }

  return {
    name: storyName,
    path: storyPath,
    artifacts,
    tasks,
    issues
  };
};

const scanTracking = async (
  fs: Pick<ProjectFileSystem, 'pathExists' | 'readDir' | 'readFile'>,
  projectRoot: string
): Promise<{
  tracking: TrackingArtifact[];
  issues: ArtifactIssue[];
}> => {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (!await fs.pathExists(trackingDir)) {
    return { tracking: [], issues: [] };
  }

  const files = (await fs.readDir(trackingDir))
    .filter(file => file.endsWith('.json'))
    .sort();
  const tracking: TrackingArtifact[] = [];
  const issues: ArtifactIssue[] = [];

  for (const file of files) {
    const filePath = path.join(trackingDir, file);
    try {
      JSON.parse(await fs.readFile(filePath));
      tracking.push({ file, path: filePath, valid: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      tracking.push({ file, path: filePath, valid: false, error: message });
      issues.push({
        severity: 'error',
        code: 'INVALID_TRACKING_JSON',
        message: `追踪 JSON 无效: ${file}`,
        path: filePath
      });
    }
  }

  return { tracking, issues };
};

export const scanStoryArtifacts = async (
  input: ScanStoryArtifactsInput
): Promise<ArtifactScanResult> => {
  const fs = input.fileSystem ?? nodeFileSystem;
  const storyNames = await listDirectories(fs, path.join(input.projectRoot, 'stories'));
  const stories = await Promise.all(storyNames.map(storyName => scanStory(fs, input.projectRoot, storyName)));
  const trackingResult = await scanTracking(fs, input.projectRoot);

  return {
    projectRoot: input.projectRoot,
    stories,
    tracking: trackingResult.tracking,
    issues: [
      ...stories.flatMap(story => story.issues),
      ...trackingResult.issues
    ]
  };
};
