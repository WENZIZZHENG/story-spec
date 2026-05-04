import { describe, expect, it } from 'vitest';
import {
  parseSceneCardDocument,
  parseStoryEdgesDocument,
  parseStoryEntitiesDocument,
  validateStoryGraph
} from '../../src/domain/story-structure.js';

describe('story structure domain', () => {
  it('parses valid story entities and edges', () => {
    const entities = parseStoryEntitiesDocument(JSON.stringify({
      entities: [{
        id: 'entity.hero',
        type: 'character',
        name: 'Hero',
        sourcePaths: ['spec/knowledge/character-profiles.md']
      }]
    }), 'spec/graph/entities.json');
    const edges = parseStoryEdgesDocument(JSON.stringify({
      edges: [{
        id: 'edge.hero.home',
        from: 'entity.hero',
        to: 'entity.home',
        relation: 'origin',
        evidencePaths: ['spec/knowledge/locations.md']
      }]
    }), 'spec/graph/edges.json');

    expect(entities.entities).toHaveLength(1);
    expect(entities.issues).toEqual([]);
    expect(edges.edges).toHaveLength(1);
    expect(edges.issues).toEqual([]);
  });

  it('requires edge evidence and reports unknown entity references', () => {
    const edges = parseStoryEdgesDocument(JSON.stringify({
      edges: [{
        id: 'edge.hero.unknown',
        from: 'entity.hero',
        to: 'entity.unknown',
        relation: 'knows'
      }]
    }), 'spec/graph/edges.json');

    expect(edges.edges).toHaveLength(0);
    expect(edges.issues).toEqual([
      expect.objectContaining({ code: 'MISSING_STORY_EDGE_FIELD' })
    ]);

    const graphIssues = validateStoryGraph({
      entities: [{
        id: 'entity.hero',
        type: 'character',
        name: 'Hero',
        aliases: [],
        status: 'active',
        sourcePaths: [],
        tags: []
      }],
      edges: [{
        id: 'edge.hero.unknown',
        from: 'entity.hero',
        to: 'entity.unknown',
        relation: 'knows',
        evidencePaths: ['stories/demo/content/chapter-001.md'],
        confidence: 'explicit'
      }]
    }, 'spec/graph');

    expect(graphIssues).toEqual([
      expect.objectContaining({
        code: 'UNKNOWN_STORY_EDGE_ENTITY',
        severity: 'error'
      })
    ]);
  });

  it('parses valid scene cards', () => {
    const result = parseSceneCardDocument(`id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Leave home
conflict: Family blocks him
outcome: He leaves anyway
plotThread: 主线推进
readerPromise: 兑现主角出走的承诺
relationshipChange: 主角和家人从对立转为暂时缓和
worldReveal:
  factId: world.example.rule
  actionImpact: 主角必须绕开规则
  beneficiaries:
    - 权力方
  costs:
    - 主角
  violationConsequence: 被执法者盯上
emotionalBeat: 从压抑转向决意
endingHook: 门外有人敲门
successCriteria:
  - 推进主角离家
  - 留下下一幕钩子
entities:
  - entity.hero
`, 'stories/demo/scenes/scene-001.yaml');

    expect(result.scenes).toHaveLength(1);
    expect(result.scenes[0]).toMatchObject({
      id: 'scene-001',
      order: 1,
      entities: ['entity.hero'],
      plotThread: '主线推进',
      readerPromise: '兑现主角出走的承诺',
      relationshipChange: '主角和家人从对立转为暂时缓和',
      emotionalBeat: '从压抑转向决意',
      endingHook: '门外有人敲门',
      successCriteria: ['推进主角离家', '留下下一幕钩子']
    });
    expect(result.scenes[0].worldReveal).toMatchObject({
      factId: 'world.example.rule',
      actionImpact: '主角必须绕开规则',
      beneficiaries: ['权力方'],
      costs: ['主角'],
      violationConsequence: '被执法者盯上'
    });
    expect(result.issues).toEqual([]);
  });

  it('reports missing scene card fields', () => {
    const result = parseSceneCardDocument('id: scene-001\nchapter: chapter-001\n', 'stories/demo/scenes/scene-001.yaml');

    expect(result.scenes).toHaveLength(0);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_SCENE_FIELD', path: expect.stringContaining('.pov') }),
      expect.objectContaining({ code: 'MISSING_SCENE_FIELD', path: expect.stringContaining('.order') })
    ]));
  });

  it('reports story-prefixed scene card paths that should be story-relative', () => {
    const result = parseSceneCardDocument(`id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Leave home
conflict: Family blocks him
outcome: He leaves anyway
plotThread: 主线推进
readerPromise: 兑现主角出走的承诺
relationshipChange: 主角和家人从对立转为暂时缓和
worldReveal:
  factId: world.example.rule
  actionImpact: 主角必须绕开规则
  beneficiaries:
    - 权力方
  costs:
    - 主角
  violationConsequence: 被执法者盯上
emotionalBeat: 从压抑转向决意
endingHook: 门外有人敲门
successCriteria:
  - 推进主角离家
requiredReads:
  - stories/demo/specification.md
allowedWrites:
  - stories/demo/content/chapter-001.md
draftPath: stories/demo/content/chapter-001.md
`, 'stories/demo/scenes/scene-001.yaml');

    expect(result.scenes).toHaveLength(1);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'INVALID_SCENE_STORY_PATH',
        path: expect.stringContaining('requiredReads[0]'),
        message: expect.stringContaining('specification.md')
      }),
      expect.objectContaining({
        code: 'INVALID_SCENE_STORY_PATH',
        path: expect.stringContaining('allowedWrites[0]'),
        message: expect.stringContaining('content/chapter-001.md')
      }),
      expect.objectContaining({
        code: 'INVALID_SCENE_STORY_PATH',
        path: expect.stringContaining('draftPath'),
        message: expect.stringContaining('content/chapter-001.md')
      })
    ]));
  });
});
