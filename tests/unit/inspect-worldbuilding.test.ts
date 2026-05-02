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
});
