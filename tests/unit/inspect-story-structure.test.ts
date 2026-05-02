import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildStoryGraphIndexes,
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
    expect(scenes.issues).toEqual([]);
    expect(renderSceneInspection(scenes)).toContain('scene-001');
  });
});
