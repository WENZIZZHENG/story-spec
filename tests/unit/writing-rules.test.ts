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
      })
    ]));
  });
});
