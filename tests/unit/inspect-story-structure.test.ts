import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildStoryGraphIndexes,
  fixSceneCardPaths,
  inspectScenes,
  inspectStoryGraph,
  renderSceneInspection,
  renderStoryGraphInspection
} from '../../src/application/inspect-story-structure.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('inspectStoryStructure', () => {
  it('inspects graph and scene documents', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-structure-inspect');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
      entities: [{
        id: 'entity.hero',
        type: 'character',
        name: 'Hero'
      }]
    });
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), {
      edges: [{
        id: 'edge.hero.self',
        from: 'entity.hero',
        to: 'entity.hero',
        relation: 'self',
        evidencePaths: ['stories/demo/content/chapter-001.md']
      }]
    });
    await fileSystem.writeFile(path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Leave home
conflict: Family blocks him
outcome: He leaves anyway
entities:
  - entity.hero
`);

    const graph = await inspectStoryGraph({ projectRoot, fileSystem });
    const scenes = await inspectScenes({ projectRoot, fileSystem });

    expect(graph.entities).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
    expect(graph.issues).toEqual([]);
    expect(renderStoryGraphInspection(graph)).toContain('entity.hero');
    expect(buildStoryGraphIndexes(graph).adjacency['entity.hero']).toEqual(['entity.hero']);

    expect(scenes.scenes).toHaveLength(1);
    expect(scenes.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_SCENE_INTENT', path: expect.stringContaining('plotThread') }),
      expect.objectContaining({ code: 'MISSING_SCENE_INTENT', path: expect.stringContaining('endingHook') })
    ]));
    expect(renderSceneInspection(scenes)).toContain('scene-001');
    expect(renderSceneInspection(scenes)).toContain('MISSING_SCENE_INTENT');
  });

  it('accepts scene cards with writing-gate intent fields', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-structure-scene-intent');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
      entities: [{
        id: 'entity.hero',
        type: 'character',
        name: 'Hero'
      }]
    });
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
    await fileSystem.writeFile(path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Leave home
conflict: Family blocks him
outcome: He leaves anyway
plotThread: 主线推进
readerPromise: 兑现出走承诺
relationshipChange: 主角和家人暂时决裂
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕过许可制度
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被巡查者通缉
emotionalBeat: 从压抑转向决意
endingHook: 门外传来陌生敲门声
successCriteria:
  - 主角做出主动选择
  - 读者知道规则代价
entities:
  - entity.hero
worldElements:
  - world.rule
reveals:
  - 许可制度会改变主角行动
`);

    const scenes = await inspectScenes({ projectRoot, fileSystem });

    expect(scenes.issues).toEqual([]);
  });

  it('filters scene scope after parsing aggregated scene card files', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-structure-aggregated-scenes');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
      entities: [{
        id: 'entity.hero',
        type: 'character',
        name: 'Hero'
      }]
    });
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
    await fileSystem.writeFile(path.join(storyPath, 'scenes', 'chapter-001.yaml'), `scenes:
  - id: scene-001
    chapter: chapter-001
    order: 1
    pov: Hero
    location: Gate
    time: Dawn
    sceneGoal: Open
    conflict: Trouble
    outcome: Move
    plotThread: 主线
    readerPromise: 谜题
    relationshipChange: 初识
    worldReveal:
      factId: world.rule
      actionImpact: 推动选择
      beneficiaries:
        - Hero
      costs:
        - Hero
      violationConsequence: 追捕
    emotionalBeat: 决意
    endingHook: 门响
    successCriteria:
      - 主角行动
    entities:
      - entity.hero
  - id: scene-002
    chapter: chapter-001
    order: 2
    pov: Hero
    location: Road
    time: Morning
    sceneGoal: Follow
    conflict: False trail
    outcome: Discover
    plotThread: 追踪线
    readerPromise: 新谜题
    relationshipChange: 协作
    worldReveal:
      factId: world.rule
      actionImpact: 改变路线
      beneficiaries:
        - Hero
      costs:
        - Hero
      violationConsequence: 迷路
    emotionalBeat: 冷静
    endingHook: 路标改写
    successCriteria:
      - 找到线索
    entities:
      - entity.hero
`);

    const scenes = await inspectScenes({
      projectRoot,
      fileSystem,
      story: 'demo',
      scenes: ['scene-002']
    });

    expect(scenes.scenes.map(scene => scene.id)).toEqual(['scene-002']);
    expect(scenes.files.map(file => path.relative(projectRoot, file).split(path.sep).join('/'))).toEqual([
      'stories/demo/scenes/chapter-001.yaml'
    ]);
    expect(scenes.sceneSources).toEqual([
      expect.objectContaining({
        sceneId: 'scene-002',
        chapter: 'chapter-001'
      })
    ]);
  });

  it('fixes story-prefixed paths in scene cards', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-structure-fix-scene-paths');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const scenePath = path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml');

    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), { entities: [] });
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
    await fileSystem.writeFile(scenePath, `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Leave home
conflict: Family blocks him
outcome: He leaves anyway
plotThread: 主线推进
readerPromise: 兑现出走承诺
relationshipChange: 主角和家人暂时决裂
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕过许可制度
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被巡查者通缉
emotionalBeat: 从压抑转向决意
endingHook: 门外传来陌生敲门声
successCriteria:
  - 主角做出主动选择
requiredReads:
  - stories/demo/specification.md
allowedWrites:
  - stories/demo/content/chapter-001.md
draftPath: stories/demo/content/chapter-001.md
`);

    const preview = await fixSceneCardPaths({ projectRoot, fileSystem, story: 'demo', write: false });
    const unchanged = await fileSystem.readFile(scenePath);

    expect(preview.changedFiles).toEqual([scenePath]);
    expect(preview.replacements).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'stories/demo/specification.md', to: 'specification.md' }),
      expect.objectContaining({ from: 'stories/demo/content/chapter-001.md', to: 'content/chapter-001.md' })
    ]));
    expect(unchanged).toContain('stories/demo/content/chapter-001.md');

    const applied = await fixSceneCardPaths({ projectRoot, fileSystem, story: 'demo', write: true });
    const fixed = await fileSystem.readFile(scenePath);

    expect(applied.changedFiles).toEqual([scenePath]);
    expect(fixed).toContain('  - specification.md');
    expect(fixed).toContain('  - content/chapter-001.md');
    expect(fixed).toContain('draftPath: content/chapter-001.md');
    expect(fixed).not.toContain('stories/demo/content/chapter-001.md');
  });
});
