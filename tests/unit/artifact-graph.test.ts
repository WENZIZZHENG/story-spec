import { describe, expect, it } from 'vitest';
import { createArtifactGraph } from '../../src/validation/artifact-graph.js';
import type { ArtifactScanResult } from '../../src/validation/artifact-scanner.js';

const scanResult: ArtifactScanResult = {
  projectRoot: '/project',
  tracking: [],
  issues: [],
  stories: [{
    name: 'demo',
    path: '/project/stories/demo',
    artifacts: [],
    issues: [{
      severity: 'warning',
      code: 'MISSING_TASK_OUTPUT',
      message: '任务 T002 的输出文件不存在: content/volume1/chapter-002.md',
      path: '/project/stories/demo/content/volume1/chapter-002.md'
    }],
    tasks: [{
      id: 'T001',
      title: '第一章',
      status: 'done',
      priority: 'P0',
      storyPath: '/project/stories/demo',
      tasksPath: '/project/stories/demo/tasks.md',
      writeReady: true,
      planOnly: false,
      dependencies: [],
      outputs: ['content/volume1/chapter-001.md'],
      requiredReads: ['stories/demo/specification.md'],
      allowedWrites: ['stories/demo/content/volume1/chapter-001.md'],
      clues: ['PL-01'],
      acceptanceCriteria: []
    }, {
      id: 'T002',
      title: '第二章',
      status: 'todo',
      priority: 'P1',
      storyPath: '/project/stories/demo',
      tasksPath: '/project/stories/demo/tasks.md',
      writeReady: true,
      planOnly: false,
      dependencies: ['T001'],
      outputs: ['content/volume1/chapter-002.md'],
      requiredReads: ['stories/demo/creative-plan.md'],
      allowedWrites: ['stories/demo/content/volume1/chapter-002.md'],
      clues: ['PL-01', 'PL-02'],
      acceptanceCriteria: []
    }]
  }]
};

describe('createArtifactGraph', () => {
  it('indexes task, chapter, clue, and blocker relationships', () => {
    const graph = createArtifactGraph(scanResult);

    expect(graph.getChapterInfluences('demo', 'content/volume1/chapter-002.md')).toMatchObject({
      storyName: 'demo',
      chapterPath: 'content/volume1/chapter-002.md',
      taskIds: ['T002'],
      clueIds: ['PL-01', 'PL-02'],
      blockerCodes: ['MISSING_TASK_OUTPUT']
    });
    expect(graph.getTasksByClue('PL-01').map(task => task.id)).toEqual(['T001', 'T002']);
    expect(graph.getBlockedTasks().map(item => [item.task.id, item.issues[0].code])).toEqual([
      ['T002', 'MISSING_TASK_OUTPUT']
    ]);
  });
});
