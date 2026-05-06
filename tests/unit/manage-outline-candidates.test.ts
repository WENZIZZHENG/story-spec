import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compareOutlineCandidates,
  createOutlineCandidate,
  forkOutlineCandidate,
  listOutlineCandidates,
  promoteOutlineCandidate,
  renderOutlineCompare,
  renderOutlineList,
  renderOutlinePromote
} from '../../src/application/manage-outline-candidates.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-outline-candidates');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');
  const planPath = path.join(storyPath, 'creative-plan.md');

  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
  await fileSystem.writeFile(planPath, [
    '# demo 创作计划',
    '',
    '## 主线目标',
    '学院线：晏无先理解学院如何垄断符文知识，再找到能被底层学生使用的替代路线。',
    '',
    '## 人物弧线',
    '晏无从急于修系统，转向先理解人和组织。',
    '',
    '## 节奏',
    '前三章保持低压探索，第六章进入制度冲突。',
    '',
    '## 风险',
    '容易讲设定太多。',
    '',
    '## 读者承诺',
    '读者会看到知识垄断被一点点撬开。'
  ].join('\n'));

  return { projectRoot, fileSystem, storyPath, planPath };
};

describe('outline candidates', () => {
  it('forks the current creative plan into a candidate without changing the formal plan', async () => {
    const { projectRoot, fileSystem, storyPath, planPath } = await createProject();
    const before = await fileSystem.readFile(planPath);

    const result = await forkOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      title: '学院线加强版',
      from: 'current',
      now: () => new Date('2026-05-06T12:00:00.000Z')
    });

    expect(result.outline).toMatchObject({
      id: '学院线加强版',
      title: '学院线加强版',
      story: 'demo',
      status: 'candidate',
      source: 'current-plan',
      sourcePath: 'stories/demo/creative-plan.md'
    });
    await expect(fileSystem.readFile(planPath)).resolves.toBe(before);
    await expect(fileSystem.readFile(path.join(storyPath, 'outlines', result.outline.id, 'creative-plan.md')))
      .resolves.toBe(before);
    await expect(fileSystem.readFile(path.join(storyPath, 'outlines', result.outline.id, 'summary.md')))
      .resolves.toContain('学院线加强版');
    await expect(fileSystem.readFile(path.join(storyPath, 'outlines', result.outline.id, 'risks.md')))
      .resolves.toContain('重新检查 tasks、Scene Card 和 Context Pack');
  });

  it('creates candidates from author text or a local file and lists them by update time', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    const filePath = path.join(projectRoot, 'notes', 'border-outline.md');
    await fileSystem.writeFile(filePath, [
      '# 边境冒险版',
      '',
      '## 主线目标',
      '边境线：晏无先解决矿村魔力枯竭，再回头看学院制度。'
    ].join('\n'));

    const textCandidate = await createOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      title: '感情线慢热版',
      text: '# 感情线慢热版\n\n## 人物弧线\n晏无先学会不把亲密关系当成调试对象。',
      now: () => new Date('2026-05-06T12:00:00.000Z')
    });
    const fileCandidate = await createOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      title: '边境冒险版',
      file: filePath,
      now: () => new Date('2026-05-06T12:05:00.000Z')
    });
    const list = await listOutlineCandidates({ projectRoot, fileSystem, story: 'demo' });

    expect(textCandidate.outline.source).toBe('author-text');
    expect(fileCandidate.outline.source).toBe('author-file');
    expect(fileCandidate.outline.sourcePath).toBe('notes/border-outline.md');
    expect(list.outlines.map(outline => outline.id)).toEqual([
      fileCandidate.outline.id,
      textCandidate.outline.id
    ]);
    await expect(fileSystem.readFile(path.join(storyPath, 'outlines', textCandidate.outline.id, 'creative-plan.md')))
      .resolves.toContain('感情线慢热版');
    expect(renderOutlineList(list)).toContain('边境冒险版');
  });

  it('compares two candidates without modifying story files', async () => {
    const { projectRoot, fileSystem, planPath } = await createProject();
    const academy = await forkOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      title: '学院线加强版',
      from: 'current',
      now: () => new Date('2026-05-06T12:00:00.000Z')
    });
    const border = await createOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      title: '边境冒险版',
      text: [
        '# 边境冒险版',
        '',
        '## 主线目标',
        '边境线：晏无先救矿村，再发现学院和贵族制度共同抽干魔力。',
        '',
        '## 人物弧线',
        '晏无从只看系统，转向承担具体人的求助。',
        '',
        '## 节奏',
        '第一章就有外部危机，第三章进入遗迹行动。',
        '',
        '## 风险',
        '学院线会延后。',
        '',
        '## 读者承诺',
        '读者会先得到冒险和解谜回报。'
      ].join('\n'),
      now: () => new Date('2026-05-06T12:10:00.000Z')
    });
    const before = await fileSystem.readFile(planPath);

    const compare = await compareOutlineCandidates({
      projectRoot,
      fileSystem,
      story: 'demo',
      leftId: academy.outline.id,
      rightId: border.outline.id
    });

    expect(compare.dimensions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: '主线目标',
        left: expect.stringContaining('学院线'),
        right: expect.stringContaining('边境线')
      }),
      expect.objectContaining({
        dimension: '读者承诺',
        right: expect.stringContaining('冒险和解谜回报')
      })
    ]));
    expect(renderOutlineCompare(compare)).toContain('Outline Compare');
    await expect(fileSystem.readFile(planPath)).resolves.toBe(before);
  });

  it('promotes a candidate only after explicit confirmation and leaves execution artifacts untouched', async () => {
    const { projectRoot, fileSystem, storyPath, planPath } = await createProject();
    const tasksPath = path.join(storyPath, 'tasks.md');
    const scenePath = path.join(storyPath, 'scenes', 'scene-001.yaml');
    const trackingPath = path.join(projectRoot, 'spec', 'tracking', 'promises.json');
    await fileSystem.writeFile(tasksPath, '# tasks');
    await fileSystem.writeFile(scenePath, 'id: scene-001');
    await fileSystem.writeFile(trackingPath, '{"promises":[]}');
    const candidate = await createOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      title: '反派提前揭示版',
      text: '# 反派提前揭示版\n\n## 主线目标\n第一卷中段提前揭示制度代理人。',
      now: () => new Date('2026-05-06T12:00:00.000Z')
    });
    const before = await fileSystem.readFile(planPath);

    const preview = await promoteOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      outlineId: candidate.outline.id,
      now: () => new Date('2026-05-06T12:05:00.000Z')
    });

    expect(preview.dryRun).toBe(true);
    expect(renderOutlinePromote(preview)).toContain('重新检查 tasks、Scene Card 和 Context Pack');
    await expect(fileSystem.readFile(planPath)).resolves.toBe(before);

    const promoted = await promoteOutlineCandidate({
      projectRoot,
      fileSystem,
      story: 'demo',
      outlineId: candidate.outline.id,
      yes: true,
      now: () => new Date('2026-05-06T12:06:00.000Z')
    });

    expect(promoted.dryRun).toBe(false);
    expect(promoted.outline.status).toBe('promoted');
    expect(promoted.outline.promotedAt).toBe('2026-05-06T12:06:00.000Z');
    await expect(fileSystem.readFile(planPath)).resolves.toContain('反派提前揭示版');
    await expect(fileSystem.readFile(tasksPath)).resolves.toBe('# tasks');
    await expect(fileSystem.readFile(scenePath)).resolves.toBe('id: scene-001');
    await expect(fileSystem.readFile(trackingPath)).resolves.toBe('{"promises":[]}');
  });
});
