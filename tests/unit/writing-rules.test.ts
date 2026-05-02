import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanStoryArtifacts } from '../../src/validation/artifact-scanner.js';
import {
  createDefaultWritingRules,
  runWritingRules
} from '../../src/validation/rules/writing-rules.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createRuleFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-writing-rules');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyRoot = path.join(projectRoot, 'stories', 'demo');

  await fileSystem.writeFile(path.join(storyRoot, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyRoot, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyRoot, 'tasks.md'), `- [ ] [P0] **T001** - 第一章
  - **依赖**：T099
  - **输出**：\`content/chapter-001.md\`
- [ ] [P1] **T002** - 第二章
  - **依赖**：T001
  - **输出**：\`content/chapter-002.md\`
`);
  await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-001.md'), '李明叫他主角。');
  await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-002.md'), '短。');
  await fileSystem.writeFile(path.join(storyRoot, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: 晏无
location: 起点
time: 第一夜
sceneGoal: 让主角发现规则
conflict: 规则压迫选择
outcome: 主角被迫承担代价
worldElements:
  - world.rule.1
  - world.rule.2
  - world.rule.3
canonFacts:
  - canon.fact.1
  - canon.fact.2
reveals: []
foreshadowing:
  planted:
    - 黑印
  paidOff: []
`);

  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'tracking', 'timeline.json'), {
    events: [
      { chapter: 2, event: '先发生' },
      { chapter: 1, event: '后记录' }
    ]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'tracking', 'validation-rules.json'), {
    characters: {
      protagonist: {
        forbidden: ['主角'],
        aliases: []
      }
    },
    common_errors: {
      character_substitution: [
        { wrong: '李明', correct: '晏无', context: '主角误名' }
      ]
    }
  });

  return {
    projectRoot,
    fileSystem,
    artifactScan: await scanStoryArtifacts({ projectRoot, fileSystem })
  };
};

describe('writing rules', () => {
  it('checks task dependencies, chapter length, timeline order, and character wording', async () => {
    const { projectRoot, fileSystem, artifactScan } = await createRuleFixture();

    const result = await runWritingRules({
      projectRoot,
      fileSystem,
      artifactScan,
      rules: createDefaultWritingRules({ minChapterChars: 8 })
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'UNKNOWN_TASK_DEPENDENCY',
        severity: 'error',
        path: path.join(projectRoot, 'stories', 'demo', 'tasks.md#T001')
      }),
      expect.objectContaining({
        code: 'CHAPTER_TOO_SHORT',
        severity: 'warning',
        path: path.join(projectRoot, 'stories', 'demo', 'content', 'chapter-002.md')
      }),
      expect.objectContaining({
        code: 'TIMELINE_CHAPTER_ORDER',
        severity: 'warning',
        path: path.join(projectRoot, 'spec', 'tracking', 'timeline.json#events[1]')
      }),
      expect.objectContaining({
        code: 'FORBIDDEN_CHARACTER_ADDRESS',
        severity: 'warning',
        path: path.join(projectRoot, 'stories', 'demo', 'content', 'chapter-001.md')
      }),
      expect.objectContaining({
        code: 'COMMON_CHARACTER_SUBSTITUTION',
        severity: 'warning',
        path: path.join(projectRoot, 'stories', 'demo', 'content', 'chapter-001.md')
      }),
      expect.objectContaining({
        code: 'WORLD_DENSITY_HIGH',
        severity: 'warning',
        path: path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml#scene-001.worldElements')
      }),
      expect.objectContaining({
        code: 'REVEAL_PACING_GAP',
        severity: 'info',
        path: path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml#scene-001.reveals')
      }),
      expect.objectContaining({
        code: 'FORESHADOWING_OPEN_LOOP',
        severity: 'info',
        path: path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml#scene-001.foreshadowing')
      })
    ]));
  });

  it('falls back to chapter-level world density checks when scene cards are missing', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-writing-rules-fallback');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyRoot = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), `worldFacts:
  - id: world.rule
    title: 灵气法则
    summary: rule
    storyFunction: conflict
    constraints:
      - cost
`);
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), JSON.stringify({
      canonFacts: [{
        id: 'canon.fact',
        summary: 'fact',
        evidence: [{ path: 'stories/demo/content/chapter-001.md' }]
      }]
    }));
    await fileSystem.writeFile(path.join(storyRoot, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyRoot, 'creative-plan.md'), '# plan');
    await fileSystem.writeFile(path.join(storyRoot, 'tasks.md'), '- [ ] [P0] **T001** - 第一章');
    await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-001.md'), '灵气法则 与 world.rule 和 canon.fact 都在这里出现。');

    const result = await runWritingRules({
      projectRoot,
      fileSystem,
      artifactScan: await scanStoryArtifacts({ projectRoot, fileSystem }),
      rules: createDefaultWritingRules({ minChapterChars: 1, maxSceneWorldReferences: 2 })
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'WORLD_DENSITY_HIGH',
        path: path.join(projectRoot, 'stories', 'demo', 'content', 'chapter-001.md')
      }),
      expect.objectContaining({
        code: 'REVEAL_PACING_GAP',
        severity: 'info',
        path: path.join(projectRoot, 'stories', 'demo', 'content', 'chapter-001.md')
      })
    ]));
  });
});
