import type { WritingTask } from '../domain/story-artifact.js';
import type {
  ArtifactIssue,
  ArtifactScanResult,
  ScannedStoryProject
} from './artifact-scanner.js';

export interface ChapterInfluence {
  storyName: string;
  chapterPath: string;
  taskIds: string[];
  clueIds: string[];
  blockerCodes: ArtifactIssue['code'][];
}

export interface BlockedTask {
  storyName: string;
  task: WritingTask;
  issues: ArtifactIssue[];
}

export interface ArtifactGraph {
  scan: ArtifactScanResult;
  getChapterInfluences(storyName: string, chapterPath: string): ChapterInfluence | null;
  getTasksByClue(clueId: string): WritingTask[];
  getBlockedTasks(): BlockedTask[];
}

const normalizePath = (value: string): string => value.replace(/\\/g, '/');

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const findStory = (
  stories: readonly ScannedStoryProject[],
  storyName: string
): ScannedStoryProject | undefined => stories.find(story => story.name === storyName);

const issueTargetsTaskOutput = (issue: ArtifactIssue, task: WritingTask): boolean => {
  if (issue.code !== 'MISSING_TASK_OUTPUT') {
    return false;
  }

  const issuePath = normalizePath(issue.path);
  return task.outputs.some(output => issuePath.endsWith(normalizePath(output)));
};

const taskOutputsChapter = (task: WritingTask, chapterPath: string): boolean => {
  const normalizedChapterPath = normalizePath(chapterPath);
  return task.outputs.some(output => normalizePath(output) === normalizedChapterPath);
};

export const createArtifactGraph = (scan: ArtifactScanResult): ArtifactGraph => ({
  scan,

  getChapterInfluences(storyName: string, chapterPath: string): ChapterInfluence | null {
    const story = findStory(scan.stories, storyName);
    if (!story) {
      return null;
    }

    const tasks = story.tasks.filter(task => taskOutputsChapter(task, chapterPath));
    const issues = tasks.flatMap(task => story.issues.filter(issue => issueTargetsTaskOutput(issue, task)));

    return {
      storyName,
      chapterPath,
      taskIds: tasks.map(task => task.id),
      clueIds: unique(tasks.flatMap(task => task.clues)),
      blockerCodes: unique(issues.map(issue => issue.code))
    };
  },

  getTasksByClue(clueId: string): WritingTask[] {
    const normalizedClueId = clueId.toUpperCase();
    return scan.stories
      .flatMap(story => story.tasks)
      .filter(task => task.clues.includes(normalizedClueId));
  },

  getBlockedTasks(): BlockedTask[] {
    return scan.stories.flatMap(story => story.tasks
      .map(task => ({
        storyName: story.name,
        task,
        issues: story.issues.filter(issue => issueTargetsTaskOutput(issue, task))
      }))
      .filter(item => item.issues.length > 0));
  }
});
