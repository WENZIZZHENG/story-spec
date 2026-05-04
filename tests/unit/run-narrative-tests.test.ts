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

    expect(report.summary.warning).toBeGreaterThanOrEqual(4);
    expect(report.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'scene-scene-001-reveal',
        status: 'warning',
        severity: 'warning',
        evidence: 'world.rule',
        suggestedAction: expect.stringContaining('reveals')
      }),
      expect.objectContaining({
        id: 'scene-scene-001-intent',
        status: 'warning',
        severity: 'warning',
        suggestedAction: expect.stringContaining('plotThread')
      }),
      expect.objectContaining({
        id: 'scene-scene-001-hook',
        status: 'warning',
        severity: 'warning',
        suggestedAction: expect.stringContaining('endingHook')
      })
    ]));
  });

  it('passes scene cards that declare plot, promise, relationship, world, emotion, and hook intent', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: 主角做出选择
conflict: 外部麻烦逼近
outcome: 主角接受任务
plotThread: 主线推进
readerPromise: 建立异变谜题
relationshipChange: 主角和向导建立最低限度信任
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕过许可制度
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被巡查者通缉
emotionalBeat: 从戒备转向试探性信任
endingHook: 寂静异象第一次逼近城市边缘
successCriteria:
  - 主角主动选择接受任务
  - 读者看到许可制度的代价
worldElements:
  - world.rule
reveals:
  - world.rule 会限制主角行动并制造代价
`);

    const report = await runNarrativeTests({
      projectRoot,
      fileSystem,
      chapter: '001'
    });

    expect(report.summary).toMatchObject({ pass: 1, warning: 0, fail: 0 });
    expect(report.results[0]).toMatchObject({
      id: 'scene-scene-001-basic-pass',
      status: 'pass'
    });
  });

  it('reports planned foreshadowing without warning about missing payoff', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: 主角做出选择
conflict: 外部麻烦逼近
outcome: 主角接受任务
plotThread: 主线推进
readerPromise: 建立异变谜题
relationshipChange: 主角和向导建立最低限度信任
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕过许可制度
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被巡查者通缉
emotionalBeat: 从戒备转向试探性信任
endingHook: 寂静异象第一次逼近城市边缘
successCriteria:
  - 主角主动选择接受任务
worldElements:
  - world.rule
reveals:
  - world.rule 会限制主角行动并制造代价
foreshadowing:
  planted:
    - 静默异常
  plannedPayoff:
    - scene-008
  paidOff: []
`);

    const report = await runNarrativeTests({
      projectRoot,
      fileSystem,
      chapter: '001'
    });

    expect(report.summary).toMatchObject({ warning: 0, fail: 0 });
    expect(report.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'scene-scene-001-foreshadowing-planned',
        status: 'pass',
        severity: 'info',
        evidence: '静默异常 -> scene-008'
      })
    ]));
  });

  it('blocks chapter writing with a scene-card gate when no scene card exists', async () => {
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

    expect(report.summary.warning).toBe(1);
    expect(report.results[0]).toMatchObject({
      id: 'chapter-chapter-001-scene-card-missing',
      status: 'warning'
    });
    expect(report.results[0].suggestedAction).toContain('scene:init');
  });
});
