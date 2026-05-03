import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compareBranch,
  createBranch,
  listBranches,
  promoteBranch
} from '../../src/application/manage-branches.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-branches');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');
  const chapterPath = path.join(storyPath, 'content', 'chapter-001.md');

  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 调整第一场转折
  - **必须读取**：
    - \`scenes/scene-001.yaml\`
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **输出**：\`content/chapter-001.md\`
`);
  await fileSystem.writeFile(chapterPath, 'main 正文');
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'tracking', 'promises.json'), {
    promises: [{
      id: 'promise.identity',
      type: 'mystery',
      promise: '身份谜题',
      establishedAt: 'scene-001',
      reinforcedAt: [],
      status: 'open',
      readerExpectation: '读者期待身份揭示'
    }]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), {
    edges: [{
      id: 'edge.hero-mentor',
      evidencePaths: ['stories/001-demo/scenes/scene-001.yaml']
    }]
  });

  return { projectRoot, fileSystem, storyPath, chapterPath };
};

describe('manage branches', () => {
  it('creates branch files under branches without changing main content', async () => {
    const { projectRoot, fileSystem, chapterPath } = await createProject();

    const created = await createBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      title: '提前揭示身份',
      changedScenes: ['scene-001'],
      changedCanonFacts: ['canon.identity']
    });

    expect(created.branch.id).toBe('提前揭示身份');
    expect(created.branch.status).toBe('exploring');
    expect(created.branchPath).toContain(path.join('stories', '001-demo', 'branches', '提前揭示身份', 'branch.json'));
    await expect(fileSystem.readFile(chapterPath)).resolves.toBe('main 正文');

    const listed = await listBranches({ projectRoot, fileSystem, story: '001-demo' });
    expect(listed.branches.map(branch => branch.id)).toEqual(['提前揭示身份']);
  });

  it('compares branch impacts and requires explicit promote confirmation', async () => {
    const { projectRoot, fileSystem, chapterPath } = await createProject();
    const created = await createBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      title: '提前揭示身份',
      changedScenes: ['scene-001']
    });

    const compared = await compareBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      branchId: created.branch.id
    });

    expect(compared.changedScenes).toEqual(['scene-001']);
    expect(compared.impactedTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'T001' })
    ]));
    expect(compared.impactedPromises).toContain('promise.identity');
    expect(compared.impactedRelationships).toContain('edge.hero-mentor');

    const preview = await promoteBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      branchId: created.branch.id
    });
    expect(preview.dryRun).toBe(true);

    const stillExploring = await listBranches({ projectRoot, fileSystem, story: '001-demo' });
    expect(stillExploring.branches[0].status).toBe('exploring');

    const promoted = await promoteBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      branchId: created.branch.id,
      yes: true
    });
    expect(promoted.dryRun).toBe(false);
    expect(promoted.branch.status).toBe('accepted');
    await expect(fileSystem.readFile(chapterPath)).resolves.toBe('main 正文');
  });

  it('renders a what-if comparison card that explains the story direction and tradeoffs', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const created = await createBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      title: '提前揭示身份',
      premise: '主角在第一场事故后立刻暴露穿越者和编程施法者身份，换取学院临时信任。',
      changedScenes: ['scene-001'],
      changedCanonFacts: ['canon.identity']
    });

    const compared = await compareBranch({
      projectRoot,
      fileSystem,
      story: '001-demo',
      branchId: created.branch.id
    });

    expect(compared.whatIfCard).toMatchObject({
      flavor: expect.stringContaining('提前'),
      readerPromiseShift: expect.stringContaining('身份谜题'),
      tradeoffs: expect.arrayContaining([
        expect.stringContaining('收益'),
        expect.stringContaining('代价')
      ]),
      relationshipShift: expect.stringContaining('edge.hero-mentor'),
      worldPressureShift: expect.stringContaining('scene-001')
    });
    expect(compared.routeMap).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: '当前主线',
        status: 'baseline'
      }),
      expect.objectContaining({
        label: 'what-if：提前揭示身份',
        status: 'exploring',
        nextCommand: `storyspec branch:promote ${created.branch.id}`
      })
    ]));
    expect(compared.report).toContain('## What-if 对照卡');
    expect(compared.report).toContain('会长成什么小说');
    expect(compared.report).toContain('读者承诺变化');
    expect(compared.report).toContain('关系线偏移');
    expect(compared.report).toContain('世界压力显露节奏');
    await expect(fileSystem.readFile(created.impactPath)).resolves.toContain('## What-if 对照卡');
  });
});
