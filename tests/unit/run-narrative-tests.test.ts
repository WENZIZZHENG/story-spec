import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runNarrativeTests } from '../../src/application/run-narrative-tests.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-narrative');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 主角主动做选择
`);
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: 主角做出选择
conflict: 外部麻烦逼近
outcome: 主角接受任务
worldElements:
  - world.rule
`);

  return { projectRoot, fileSystem, storyPath };
};

describe('run narrative tests', () => {
  it('reports scene-level reveal gaps with actionable findings', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const report = await runNarrativeTests({
      projectRoot,
      fileSystem,
      chapter: '001'
    });

    expect(report.summary.warning).toBe(1);
    expect(report.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'scene-scene-001-reveal',
        status: 'warning',
        severity: 'warning',
        evidence: 'world.rule',
        suggestedAction: expect.stringContaining('reveals')
      })
    ]));
  });

  it('falls back to chapter tasks when no scene card exists', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-narrative-fallback');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '001-demo');

    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 主角主动做选择
`);

    const report = await runNarrativeTests({
      projectRoot,
      fileSystem,
      chapter: '001'
    });

    expect(report.summary.pass).toBe(1);
    expect(report.results[0]).toMatchObject({
      id: 'task-T001-fallback-pass',
      status: 'pass'
    });
  });
});
