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
entities:
  - entity.hero
`, 'stories/demo/scenes/scene-001.yaml');

    expect(result.scenes).toHaveLength(1);
    expect(result.scenes[0]).toMatchObject({
      id: 'scene-001',
      order: 1,
      entities: ['entity.hero']
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
});
