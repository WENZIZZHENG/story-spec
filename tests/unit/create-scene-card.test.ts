import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createInitialSceneCard,
  renderSceneCardCreateSummary
} from '../../src/application/create-scene-card.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('createInitialSceneCard', () => {
  it('uses current story context when creating the first scene card', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-scene-create');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-scene-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeFile(path.join(packageRoot, 'templates', 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: 主角
location: 起始地点
time: 故事开始
sceneGoal: 建立主角当下目标
conflict: 主角目标遭遇阻力
outcome: 主角做出会推动下一幕的选择
plotThread: 本场推进哪条主线/支线
readerPromise: 本场建立、强化或兑现哪个读者承诺
relationshipChange: 本场改变哪段关系，以及 trust/distance/conflict/vulnerability/repair 哪项变化
emotionalBeat: 读者或 POV 角色从什么情绪转到什么情绪
endingHook: 本场最后留下的下一幕期待
successCriteria:
  - 主角必须做出一个可见选择
worldReveal:
  factId: world.example.rule
  actionImpact: 这条规则如何改变角色本场选择
  beneficiaries:
    - 获利方
  costs:
    - 受损方或代价
  violationConsequence: 如果主角违反规则，会发生什么后果
entities:
  - entity.protagonist
worldElements:
  - world.example.rule
canonFacts:
  - canon.example.fact
requiredReads:
  - .specify/memory/constitution.md
  - stories/*/specification.md
  - stories/*/creative-plan.md
allowedWrites:
  - stories/*/content/chapter-001.md
draftPath: stories/*/content/chapter-001.md
`);
    const storyPath = path.join(projectRoot, 'stories', '星尘驿站');
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# 星尘驿站 StorySpec v0\n\n岑舟在宇宙边境经营给迷路灵魂和破损飞船歇脚的驿站。');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# 星尘驿站 创作计划 v0');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '星尘驿站',
      premise: '退休星舰导航员在宇宙边境开了一间给迷路灵魂和破损飞船歇脚的驿站。',
      createdAt: '2026-05-04T00:00:00.000Z',
      updatedAt: '2026-05-04T00:00:00.000Z',
      questions: [
        {
          id: 'protagonist.identity',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响视角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'stage.first',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响第一幕。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'protagonist.identity',
          answer: '主角岑舟是退休星舰导航员。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'stage.first',
          answer: '第一舞台是宇宙边境的星尘驿站大厅。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createInitialSceneCard({
      projectRoot,
      packageRoot,
      fileSystem,
      story: '星尘驿站'
    });

    const content = await fileSystem.readFile(result.outputPath);
    expect(content).toContain('storyContext:');
    expect(content).toContain('story: 星尘驿站');
    expect(content).toContain('主角岑舟是退休星舰导航员。');
    expect(content).toContain('第一舞台是宇宙边境的星尘驿站大厅。');
    expect(content).toContain('stories/星尘驿站/specification.md');
    expect(content).toContain('stories/星尘驿站/creative-plan.md');
    expect(content).not.toContain('world.example.rule');
    expect(renderSceneCardCreateSummary(result)).toContain('候选上下文：2');
  });
});
