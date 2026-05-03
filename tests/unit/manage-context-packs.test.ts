import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  generateContextPack,
  validateContextPack
} from '../../src/application/manage-context-packs.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-context-pack');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# Agents');
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'memory', 'constitution.md'), '# constitution');
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
    schemaVersion: '1.0',
    story: '001-demo',
    premise: '异界穿越',
    createdAt: '2026-05-03T00:00:00.000Z',
    updatedAt: '2026-05-03T00:00:00.000Z',
    questions: [
      {
        id: 'romance.boundary',
        stage: 'specify',
        topic: 'romance',
        question: '感情线慢热边界是什么？',
        whyItMatters: '避免过早定关系。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: [],
        dependsOn: []
      }
    ],
    answers: [
      {
        questionId: 'romance.boundary',
        answer: '第一卷只到互相信任',
        source: 'ai-suggested',
        confidence: 0.6,
        confirmed: false,
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z'
      }
    ]
  }, { spaces: 2 });
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-000.md'), '# 前情\n\n主角已经出发。');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), `worldFacts:
  - id: world.rule
    title: Rule
    summary: Summary
    storyFunction: Creates conflict
    constraints:
      - Must hold
`);
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), JSON.stringify({
    canonFacts: [{
      id: 'canon.fact',
      summary: 'Fact',
      evidence: [{ path: 'stories/001-demo/content/chapter-000.md' }]
    }]
  }));
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
    entities: [{ id: 'entity.hero', type: 'character', name: 'Hero' }]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'character-voices.yaml'), `voiceFingerprints:
  - characterId: entity.hero
    sentenceLength: mixed
    forbiddenWords:
      - 随便
    addressRules:
      peer: 你
    emotionalExpression: short
    conflictStyle: direct
    samplePaths:
      - spec/voice/samples/hero.md
`);
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'samples', 'hero.md'), '# Hero voice');
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Open story
conflict: Trouble arrives
outcome: Hero accepts
entities:
  - entity.hero
draftPath: stories/001-demo/content/chapter-001.md
`);
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **必须读取**：
    - \`specification.md\`
    - \`creative-plan.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
    - \`tasks.md\`
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 覆盖关键冲突
`);

  return { projectRoot, fileSystem, storyPath };
};

describe('manage context packs', () => {
  it('generates a context pack with reasons and allowed writes', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await generateContextPack({
      projectRoot,
      fileSystem,
      task: 'T001',
      now: () => new Date('2026-05-02T09:00:00.000Z')
    });

    expect(result.outputJsonPath).toBe(path.join(projectRoot, '.specify', 'context-packs', '001-demo.t001.write-pack.json'));
    expect(result.pack).toMatchObject({
      id: '001-demo.t001.write-pack',
      purpose: 'write',
      story: '001-demo',
      targetTask: 'T001',
      generatedAt: '2026-05-02T09:00:00.000Z'
    });
    expect(result.pack.mustRead).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'stories/001-demo/specification.md',
        reason: expect.stringContaining('故事规格')
      }),
      expect.objectContaining({
        path: 'stories/001-demo/clarifications.json',
        reason: expect.stringContaining('澄清记录')
      }),
      expect.objectContaining({
        path: 'spec/world/rules.yaml',
        required: false
      })
    ]));
    expect(result.pack.allowedWrites).toEqual([
      'stories/001-demo/content/chapter-001.md',
      'stories/001-demo/tasks.md'
    ]);
    expect(result.pack.worldFacts).toEqual(['world.rule']);
    expect(result.pack.canonFacts).toEqual(['canon.fact']);
    expect(result.pack.sceneCards).toEqual(['scene-001']);
    expect(result.pack.voiceFingerprints).toEqual(['entity.hero']);
    expect(result.pack.constraints).toContain('不得擅自定稿：未确认：感情线慢热边界是什么？');
    expect(result.pack.constraints).toContain('不得擅自定稿：AI 建议待确认：romance.boundary');
    expect(result.markdown).toContain('## 必须读取');
    await expect(fileSystem.pathExists(result.outputJsonPath!)).resolves.toBe(true);
    await expect(fileSystem.pathExists(result.outputMarkdownPath!)).resolves.toBe(true);
  });

  it('validates missing required files in context packs', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const result = await generateContextPack({
      projectRoot,
      fileSystem,
      task: 'T001'
    });
    await fileSystem.writeJson(result.outputJsonPath!, {
      ...result.pack,
      mustRead: [
        ...result.pack.mustRead,
        {
          path: 'missing.md',
          reason: '',
          required: true
        }
      ]
    }, { spaces: 2 });

    const validation = await validateContextPack({
      projectRoot,
      fileSystem,
      packPath: result.outputJsonPath!
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CONTEXT_PACK_EMPTY_REASON' }),
      expect.objectContaining({ code: 'CONTEXT_PACK_MISSING_FILE', severity: 'error' })
    ]));
  });
});
