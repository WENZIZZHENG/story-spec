import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  renderReviewReport,
  reviewProject
} from '../../src/application/review-project.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createReviewFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-review-project');
  const packageRoot = path.join(os.tmpdir(), 'memory-novel-review-package');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');

  await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
    name: 'review-demo',
    type: 'novel'
  });
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
  await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
  await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), 'worldFacts: []');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), '{"canonFacts":[]}');
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), { entities: [] });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'character-voices.yaml'), `voiceFingerprints:
  - characterId: entity.hero
`);
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P0] **T001** - 起草第一章
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
`);
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '短');
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: 主角
location: 起点
time: 第一夜
sceneGoal: 发现规则
conflict: 规则阻碍行动
outcome: 主角承担代价
worldElements:
  - world.1
  - world.2
  - world.3
  - world.4
  - world.5
canonFacts: []
reveals: []
foreshadowing:
  planted:
    - 黑印
  paidOff: []
`);

  return { projectRoot, packageRoot, fileSystem };
};

describe('reviewProject', () => {
  it('groups validation and quality findings into reviewer reports and task drafts', async () => {
    const fixture = await createReviewFixture();

    const result = await reviewProject({
      ...fixture,
      panel: ['worldbuilding', 'voice', 'editor']
    });

    expect(result.reviewers.map(reviewer => reviewer.id)).toEqual(['worldbuilding', 'voice', 'editor']);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reviewerId: 'worldbuilding',
        code: 'WORLD_DENSITY_HIGH',
        path: 'stories/demo/scenes/scene-001.yaml#scene-001.worldElements',
        suggestedAction: expect.stringContaining('拆分')
      }),
      expect.objectContaining({
        reviewerId: 'voice',
        code: 'MISSING_VOICE_FIELD'
      }),
      expect.objectContaining({
        reviewerId: 'editor',
        code: 'CHAPTER_TOO_SHORT'
      })
    ]));
    expect(result.taskDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        task_title: expect.stringContaining('WORLD_DENSITY_HIGH'),
        sourceFinding: 'worldbuilding:WORLD_DENSITY_HIGH'
      })
    ]));

    const report = renderReviewReport(result);
    expect(report).toContain('Novel Writer 审稿面板');
    expect(report).toContain('世界观审稿人');
    expect(report).toContain('WORLD_DENSITY_HIGH');
  });

  it('can limit findings to one chapter', async () => {
    const fixture = await createReviewFixture();
    await fixture.fileSystem.writeFile(path.join(fixture.projectRoot, 'stories', 'demo', 'content', 'chapter-002.md'), '短');

    const result = await reviewProject({
      ...fixture,
      panel: ['worldbuilding', 'editor'],
      chapter: '001'
    });

    expect(result.findings.map(finding => finding.path)).toEqual(expect.arrayContaining([
      'stories/demo/scenes/scene-001.yaml#scene-001.worldElements'
    ]));
    expect(result.findings.some(finding => finding.path.includes('chapter-002.md'))).toBe(false);
  });
});
