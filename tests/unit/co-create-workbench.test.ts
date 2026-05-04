import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  renderCoCreateWorkbench,
  runCoCreateWorkbench
} from '../../src/application/co-create-workbench.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const LONG_INPUT = [
  '核心创意：工科马列青年晏无穿越到剑与魔法的世界，在魔导边境学院获得学生身份，觉醒法术程序理解能力。',
  '主角：晏无开朗务实，遇事先拆问题，再找主要矛盾，缺点是感情迟钝。',
  '能力体系：他能以编程思维理解符文组合，建立法术程序，限制是精神力有限、材料有限、初期正面战力弱。',
  '第一舞台：魔导边境学院，知识解释权被学院高层和贵族系统垄断。',
  '核心伙伴：莉莉丝重新拥有名字和选择，瑟琳娜追寻真正正义，塞拉斯蒂娅从书斋走向实践。',
  '创作边界：第一阶段不能定稿最终反派、长线威胁真相和感情线归属。'
].join('\n\n');

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-co-create-workbench');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '法术程序师');

  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 法术程序师');
  await fileSystem.writeFile(path.join(projectRoot, 'notes.md'), LONG_INPUT);

  return { projectRoot, fileSystem, storyPath };
};

describe('co-create workbench', () => {
  it('previews long-form input and tells the author how to confirm it', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await runCoCreateWorkbench({
      projectRoot,
      fileSystem,
      story: '法术程序师',
      file: 'notes.md'
    });
    const rendered = renderCoCreateWorkbench(result);

    expect(result.ingest?.written).toBe(false);
    expect(result.ingest?.confirmedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.premise' }),
      expect.objectContaining({ questionId: 'core.scope' })
    ]));
    await expect(fileSystem.pathExists(path.join(storyPath, 'clarifications.json'))).resolves.toBe(false);
    expect(result.nextCommands).toContain('storyspec co:create "法术程序师" --file "notes.md" --apply-confirmed');
    expect(rendered).toContain('StorySpec 共创输入工作台');
    expect(rendered).toContain('输入吸收：预览未写入');
    expect(rendered).toContain('核心信息面板');
    expect(rendered).toContain('storyspec co:create "法术程序师" --file "notes.md" --apply-confirmed');
  });

  it('can apply confirmed input and create a specification preview in one run', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await runCoCreateWorkbench({
      projectRoot,
      fileSystem,
      story: '法术程序师',
      file: 'notes.md',
      applyConfirmed: true,
      preview: 'specify',
      now: () => new Date('2026-05-04T12:00:00.000Z')
    });
    const rendered = renderCoCreateWorkbench(result);

    expect(result.ingest?.written).toBe(true);
    expect(result.core.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'premise', status: 'confirmed', sourceLabel: '作者确认' }),
      expect.objectContaining({ id: 'scope', status: 'confirmed', sourceLabel: '作者确认' })
    ]));
    expect(result.previews.specify?.record.kind).toBe('specify');
    expect(result.nextCommands).toContain(`storyspec apply ${result.previews.specify?.record.id} --yes`);
    await expect(fileSystem.readFile(path.join(storyPath, 'clarifications.json'))).resolves.toContain('core.scope');
    expect(rendered).toContain('输入吸收：已写入');
    expect(rendered).toContain('规格预览');
    expect(rendered).toContain('storyspec apply');
  });
});
