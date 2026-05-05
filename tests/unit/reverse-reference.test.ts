import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  renderReferenceReverseResult,
  reverseReferenceNotes,
  ReverseReferenceError
} from '../../src/application/reverse-reference.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const NOTES = [
  '参考作品：灰塔符文师',
  '我喜欢：底层矿村少年被贵族学院压迫，但靠符文知识一点点获得解释权；爽点是把看似神秘的魔法拆成可调试规则。',
  '我不喜欢：后期主角突然继承原作里的灰塔王座，和女主艾琳娜的关系变成强行献祭。',
  '想修复：保留阶层压迫、知识垄断、师徒信任慢热、魔力枯竭危机，但不要直接沿用灰塔、艾琳娜、黑曜教团和第七符文这些专名。',
  '后续愿望：不要续写原作结局，而是做一个新故事：边境维修工用工程方法重建魔法公共设施。'
].join('\n');

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-storyspec-reference');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '新法术公共设施');
  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 新法术公共设施\n\n原创故事。');

  return { projectRoot, fileSystem, storyPath };
};

describe('reverseReferenceNotes', () => {
  it('turns author reference notes into preview-only original candidates', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await reverseReferenceNotes({
      projectRoot,
      fileSystem,
      story: '新法术公共设施',
      title: '灰塔符文师',
      text: NOTES
    });
    const rendered = renderReferenceReverseResult(result);

    expect(result.written).toBe(false);
    expect(result.story).toBe('新法术公共设施');
    expect(result.source).toMatchObject({
      title: '灰塔符文师',
      inputLength: NOTES.length
    });
    expect(result.originalDependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        item: '灰塔',
        reason: expect.stringContaining('专有')
      }),
      expect.objectContaining({
        item: '艾琳娜',
        reason: expect.stringContaining('专有')
      }),
      expect.objectContaining({
        item: '黑曜教团',
        reason: expect.stringContaining('专有')
      })
    ]));
    expect(result.highRiskSimilarities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: '直接续写或修复原作结局',
        evidence: expect.stringContaining('不要续写原作结局')
      })
    ]));
    expect(result.translatableStructures.map(item => item.label)).toEqual(expect.arrayContaining([
      '知识垄断与解释权',
      '阶层压迫',
      '规则化能力爽点',
      '未完成承诺或不适点修复'
    ]));
    expect(result.newStoryCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: '原创世界压力',
        candidate: expect.stringContaining('公共')
      }),
      expect.objectContaining({
        label: '原创主角功能',
        candidate: expect.stringContaining('边缘职业')
      })
    ]));
    expect(result.doNotCopy).toEqual(expect.arrayContaining([
      '不要照搬参考作品角色名、地名、势力名或专有术语。',
      '不要生成未授权的原作续写正文。'
    ]));
    expect(rendered).toContain('StorySpec 参考作品反向拆解预览');
    expect(rendered).toContain('预览未写入');
    expect(rendered).toContain('原作依赖项');
    expect(rendered).toContain('可原创化结构');
    await expect(fileSystem.pathExists(path.join(storyPath, 'specification.md'))).resolves.toBe(false);
    await expect(fileSystem.pathExists(path.join(projectRoot, 'spec', 'world', 'world.yaml'))).resolves.toBe(false);
  });

  it('requires text or file input', async () => {
    const { projectRoot, fileSystem } = await createProject();

    await expect(reverseReferenceNotes({
      projectRoot,
      fileSystem,
      story: '新法术公共设施'
    })).rejects.toEqual(expect.objectContaining({
      code: 'MISSING_REFERENCE_INPUT'
    }));
  });

  it('reads reference notes from a local file', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await fileSystem.writeFile(path.join(projectRoot, 'research', 'notes', 'gray-tower.md'), NOTES);

    const result = await reverseReferenceNotes({
      projectRoot,
      fileSystem,
      story: '新法术公共设施',
      file: 'research/notes/gray-tower.md'
    });

    expect(result.source.sourceFile).toBe(path.join(projectRoot, 'research', 'notes', 'gray-tower.md'));
    expect(result.source.title).toBe('灰塔符文师');
    expect(result.originalDependencies.map(item => item.item)).toContain('第七符文');
  });

  it('exposes typed errors for callers', () => {
    const error = new ReverseReferenceError('MISSING_REFERENCE_INPUT', '缺少输入');

    expect(error.name).toBe('ReverseReferenceError');
    expect(error.code).toBe('MISSING_REFERENCE_INPUT');
  });
});
