import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  inspectCanon,
  inspectWorld,
  renderCanonInspection,
  renderWorldInspection
} from '../../src/application/inspect-worldbuilding.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('inspectWorldbuilding', () => {
  it('inspects world and canon documents', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-worldbuilding-inspect');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), `worldFacts:
  - id: world.rule
    title: Rule
    summary: Summary
    storyFunction: Conflict
    constraints:
      - Must hold
`);
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), JSON.stringify({
      canonFacts: [{
        id: 'canon.fact',
        summary: 'Fact',
        evidence: ['stories/demo/content/chapter-001.md']
      }]
    }));

    const world = await inspectWorld({ projectRoot, fileSystem });
    const canon = await inspectCanon({ projectRoot, fileSystem });

    expect(world.facts).toHaveLength(1);
    expect(world.issues).toEqual([]);
    expect(renderWorldInspection(world)).toContain('world.rule');

    expect(canon.facts).toHaveLength(1);
    expect(canon.issues).toEqual([]);
    expect(renderCanonInspection(canon)).toContain('canon.fact');
  });

  it('renders source warnings for unconfirmed AI suggestions', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-worldbuilding-source');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), `worldFacts:
  - id: world.ai-rule
    title: AI Rule
    summary: AI suggested rule
    storyFunction: It changes conflict
    constraints:
      - Must hold
    status: confirmed
    source:
      aiSuggested: true
      confirmedByUser: false
`);
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), JSON.stringify({
      canonFacts: [{
        id: 'canon.ai-fact',
        summary: 'AI fact',
        evidence: ['stories/demo/content/chapter-001.md'],
        status: 'confirmed',
        source: {
          aiSuggested: true,
          confirmedByUser: false
        }
      }]
    }));

    const world = await inspectWorld({ projectRoot, fileSystem });
    const canon = await inspectCanon({ projectRoot, fileSystem });

    expect(world.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNCONFIRMED_AI_WORLD_FACT' })
    ]));
    expect(canon.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNCONFIRMED_AI_CANON_FACT' })
    ]));
    expect(renderWorldInspection(world)).toContain('UNCONFIRMED_AI_WORLD_FACT');
    expect(renderCanonInspection(canon)).toContain('UNCONFIRMED_AI_CANON_FACT');
  });
});
