import { describe, expect, it } from 'vitest';
import {
  parseCanonDocument,
  parseWorldDocument
} from '../../src/domain/worldbuilding.js';

describe('worldbuilding domain parsers', () => {
  it('parses valid world facts', () => {
    const result = parseWorldDocument(`worldFacts:
  - id: world.rule
    title: Rule
    type: rule
    summary: Summary
    storyFunction: Creates conflict
    constraints:
      - Must hold
    sourcePaths:
      - spec/knowledge/world-setting.md
    status: confirmed
`, 'spec/world/rules.yaml');

    expect(result.issues).toEqual([]);
    expect(result.worldFacts).toEqual([
      expect.objectContaining({
        id: 'world.rule',
        storyFunction: 'Creates conflict',
        constraints: ['Must hold']
      })
    ]);
  });

  it('reports missing world fact fields', () => {
    const result = parseWorldDocument(`worldFacts:
  - id: world.rule
`, 'spec/world/rules.yaml');

    expect(result.worldFacts).toEqual([]);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_WORLD_FACT_FIELD', path: 'spec/world/rules.yaml#worldFacts[0].title' }),
      expect.objectContaining({ code: 'MISSING_WORLD_FACT_FIELD', path: 'spec/world/rules.yaml#worldFacts[0].storyFunction' }),
      expect.objectContaining({ code: 'MISSING_WORLD_FACT_FIELD', path: 'spec/world/rules.yaml#worldFacts[0].constraints' })
    ]));
  });

  it('parses valid canon facts', () => {
    const result = parseCanonDocument(JSON.stringify({
      canonFacts: [{
        id: 'canon.fact',
        summary: 'Fact',
        type: 'event',
        evidence: [{ path: 'stories/001/content/chapter-001.md', quote: 'Fact quote' }],
        affectedEntities: ['hero'],
        status: 'confirmed'
      }]
    }), 'spec/canon/facts.json');

    expect(result.issues).toEqual([]);
    expect(result.canonFacts).toEqual([
      expect.objectContaining({
        id: 'canon.fact',
        evidence: [{ path: 'stories/001/content/chapter-001.md', quote: 'Fact quote' }]
      })
    ]);
  });

  it('reports missing canon evidence', () => {
    const result = parseCanonDocument(JSON.stringify({
      canonFacts: [{ id: 'canon.fact', summary: 'Fact' }]
    }), 'spec/canon/facts.json');

    expect(result.canonFacts).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'MISSING_CANON_FACT_FIELD', path: 'spec/canon/facts.json#canonFacts[0].evidence' })
    ]);
  });
});
