import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ingestStoryInput,
  renderIngestStoryInputResult
} from '../../src/application/ingest-story-input.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const LONG_INPUT = [
  '核心创意：工科马列青年晏无穿越到剑与魔法的世界，在魔导边境学院获得学生身份，觉醒法术程序理解能力，并在实习、救援和冲突中逐步看见并改造魔法世界的制度程序。',
  '主角：晏无开朗务实，遇事先拆问题，再找主要矛盾。尊重人，行动力强，擅长把复杂问题拆成可执行步骤。缺点是感情迟钝，容易把亲密关系也当成需要调试的问题。',
  '能力体系：他能以编程思维理解符文组合，建立法术程序。能力来源是穿越事故、禁区残响和符文碎片，让他能感知魔力流向、符文连接和术式断点。限制是精神力有限，材料有限，正面战力初期弱，也会被制度程序牵制。',
  '第一舞台：魔导边境学院，人类六国联合创办的最高魔法学府，表面知识无国界，真实问题是知识解释权被学院高层和贵族系统垄断。',
  '核心伙伴：莉莉丝是魔族遗民，长期被囚禁和研究，后来成为团队制造核心；瑟琳娜是守序剑士，负责外部防线；塞拉斯蒂娅是精灵学者，负责理论校验。',
  '创作边界：第一阶段不能定稿第一卷最终反派、长线文明威胁真相、感情线归属和莉莉丝身份背后的完整阴谋，只能作为候选逐步揭示。',
  '风格补充：我希望学院日常和实习任务里有轻松冒险的互动感，也要能看到晏无用拆问题、找主要矛盾、做可执行步骤的方法理解异世界制度。规则呈现中度偏硬，关键事故讲清代价，日常对话保持轻巧。'
].join('\n\n');

const UNTITLED_INPUT = [
  '晏无是个开朗务实的工科马列青年，穿越后没有把异界当成游戏副本，而是习惯先拆问题、找主要矛盾，再把复杂事故拆成可以执行的步骤。他尊重人，行动力强，但感情迟钝，容易把亲密关系也理解成需要调试的系统。',
  '故事开局放在魔导边境学院。这里表面上是人类六国共同创办的最高魔法学府，口号是知识无国界，实际问题却是知识解释权被学院高层和贵族系统垄断，普通学生、底层工作人员和老学者都被制度程序牵制。',
  '他的能力来自穿越事故、禁区残响和符文碎片，能感知魔力流向、符文连接和术式断点。他用现代工程思维把异常理解为可读、可测、可调试的系统，建立法术程序；但精神力有限，材料有限，初期正面战力弱。',
  '团队里有莉莉丝、瑟琳娜和塞拉斯蒂娅。莉莉丝曾被囚禁和研究，拥有材料变换天赋，弧线是从被驯化对象变成主动制造者；瑟琳娜守序正直，负责外部防线；塞拉斯蒂娅是精灵学者，负责理论校验。',
  '第一阶段我不想提前定稿最终反派、长线文明威胁真相、感情线归属和莉莉丝身份背后的完整阴谋。这些只能作为候选逐步揭示，第一卷更关注学院制度、实习任务、救援事故和伙伴互动。'
].join('\n\n');

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-storyspec-ingest');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '法术程序师');

  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), [
    '# 法术程序师 创意草稿',
    '',
    '## 用户原文',
    '',
    '工科青年穿越到剑与魔法世界。'
  ].join('\n'));

  return { projectRoot, fileSystem, storyPath };
};

describe('ingestStoryInput', () => {
  it('splits long author text into confirmed suggestions without writing by default', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await ingestStoryInput({
      projectRoot,
      fileSystem,
      story: '法术程序师',
      text: LONG_INPUT,
      now: () => new Date('2026-05-04T12:00:00.000Z')
    });
    const rendered = renderIngestStoryInputResult(result);

    expect(result.written).toBe(false);
    expect(result.ingestedTextLength).toBeGreaterThan(500);
    expect(result.confirmedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.premise', sourceLabel: '核心创意' }),
      expect.objectContaining({ questionId: 'core.protagonist', sourceLabel: '主角' }),
      expect.objectContaining({ questionId: 'core.partner', sourceLabel: '核心伙伴' }),
      expect.objectContaining({ questionId: 'core.stage', sourceLabel: '第一舞台' }),
      expect.objectContaining({ questionId: 'magic.rule-hardness', sourceLabel: '能力体系' }),
      expect.objectContaining({ questionId: 'core.scope', sourceLabel: '创作边界' })
    ]));
    expect(result.pendingQuestions).toEqual(expect.arrayContaining([
      expect.stringContaining('势力与冲突')
    ]));
    expect(rendered).toContain('预览未写入');
    expect(rendered).toContain('core.premise');
    await expect(fileSystem.pathExists(path.join(storyPath, 'clarifications.json'))).resolves.toBe(false);
  });

  it('applies confirmed items through the clarification record gate when requested', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await ingestStoryInput({
      projectRoot,
      fileSystem,
      story: '法术程序师',
      text: LONG_INPUT,
      applyConfirmed: true,
      now: () => new Date('2026-05-04T12:30:00.000Z')
    });

    expect(result.written).toBe(true);
    expect(result.updatedAnswerIds).toEqual(expect.arrayContaining([
      'core.premise',
      'core.protagonist',
      'core.partner',
      'core.stage',
      'magic.rule-hardness',
      'core.scope'
    ]));
    await expect(fileSystem.readJson(path.join(storyPath, 'clarifications.json')))
      .resolves.toMatchObject({
        story: '法术程序师',
        answers: expect.arrayContaining([
          expect.objectContaining({
            questionId: 'core.scope',
            source: 'user-explicit',
            confirmed: true,
            answer: expect.stringContaining('不能定稿第一卷最终反派')
          })
        ])
      });
    await expect(fileSystem.readFile(path.join(storyPath, 'clarifications.md')))
      .resolves.toContain('core.scope：第一阶段不能定稿第一卷最终反派');
  });

  it('keeps unlabelled long-form clues as candidates instead of auto-confirming them', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await ingestStoryInput({
      projectRoot,
      fileSystem,
      story: '法术程序师',
      text: UNTITLED_INPUT,
      applyConfirmed: true,
      now: () => new Date('2026-05-04T13:00:00.000Z')
    });
    const rendered = renderIngestStoryInputResult(result);

    expect(result.confirmedItems).toEqual([]);
    expect(result.candidateItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        questionId: 'core.protagonist',
        sourceLabel: '候选：主角',
        confidence: 0.55,
        answer: expect.stringContaining('开朗务实')
      }),
      expect.objectContaining({
        questionId: 'core.stage',
        sourceLabel: '候选：第一舞台',
        answer: expect.stringContaining('魔导边境学院')
      }),
      expect.objectContaining({
        questionId: 'magic.rule-hardness',
        sourceLabel: '候选：能力体系',
        answer: expect.stringContaining('法术程序')
      }),
      expect.objectContaining({
        questionId: 'core.scope',
        sourceLabel: '候选：创作边界',
        answer: expect.stringContaining('不想提前定稿')
      })
    ]));
    expect(result.written).toBe(false);
    expect(result.updatedAnswerIds).toEqual([]);
    expect(rendered).toContain('保留候选');
    expect(rendered).toContain('候选：主角');
    await expect(fileSystem.pathExists(path.join(storyPath, 'clarifications.json'))).resolves.toBe(false);
  });
});
