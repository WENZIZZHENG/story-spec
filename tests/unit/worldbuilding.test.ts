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
    source:
      confirmedByUser: true
      aiSuggested: false
      needsClarification: []
`, 'spec/world/rules.yaml');

    expect(result.issues).toEqual([]);
    expect(result.worldFacts).toEqual([
      expect.objectContaining({
        id: 'world.rule',
        storyFunction: 'Creates conflict',
        constraints: ['Must hold'],
        source: {
          confirmedByUser: true,
          aiSuggested: false,
          needsClarification: []
        }
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
        status: 'confirmed',
        source: {
          confirmedByUser: true,
          aiSuggested: false,
          needsClarification: []
        }
      }]
    }), 'spec/canon/facts.json');

    expect(result.issues).toEqual([]);
    expect(result.canonFacts).toEqual([
      expect.objectContaining({
        id: 'canon.fact',
        evidence: [{ path: 'stories/001/content/chapter-001.md', quote: 'Fact quote' }],
        source: {
          confirmedByUser: true,
          aiSuggested: false,
          needsClarification: []
        }
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

  it('warns when AI-suggested world or canon facts are confirmed without user confirmation', () => {
    const world = parseWorldDocument(`worldFacts:
  - id: world.ai-rule
    title: AI Rule
    summary: AI suggested rule
    storyFunction: It changes the world
    constraints:
      - Must hold
    status: confirmed
    source:
      aiSuggested: true
      confirmedByUser: false
`, 'spec/world/rules.yaml');
    const canon = parseCanonDocument(JSON.stringify({
      canonFacts: [{
        id: 'canon.ai-fact',
        summary: 'AI suggested fact',
        evidence: [{ path: 'stories/demo/content/chapter-001.md' }],
        status: 'confirmed',
        source: {
          aiSuggested: true,
          confirmedByUser: false
        }
      }]
    }), 'spec/canon/facts.json');

    expect(world.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'UNCONFIRMED_AI_WORLD_FACT',
        path: 'spec/world/rules.yaml#worldFacts[0].source',
        severity: 'warning'
      })
    ]));
    expect(canon.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'UNCONFIRMED_AI_CANON_FACT',
        path: 'spec/canon/facts.json#canonFacts[0].source',
        severity: 'warning'
      })
    ]));
  });

  it('keeps pending world and canon facts out of confirmed canon checks', () => {
    const world = parseWorldDocument(`worldFacts:
  - id: world.pending-rule
    title: Pending Rule
    summary: Pending rule
    storyFunction: It may change conflict
    constraints:
      - Must hold
    status: draft
    source:
      aiSuggested: true
      confirmedByUser: false
      needsClarification:
        - 是否保留这条规则？
`, 'spec/world/rules.yaml');
    const canon = parseCanonDocument(JSON.stringify({
      canonFacts: [{
        id: 'canon.pending-fact',
        summary: 'Pending fact',
        evidence: [{ path: 'stories/demo/content/chapter-001.md' }],
        status: 'draft',
        source: {
          aiSuggested: true,
          confirmedByUser: false,
          needsClarification: ['是否进入正典？']
        }
      }]
    }), 'spec/canon/facts.json');

    expect(world.issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNCONFIRMED_AI_WORLD_FACT' })
    ]));
    expect(canon.issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNCONFIRMED_AI_CANON_FACT' })
    ]));
  });

  it('warns when confirmed facts omit source evidence or confirmation state', () => {
    const world = parseWorldDocument(`worldFacts:
  - id: world.confirmed-rule
    title: Confirmed Rule
    summary: Confirmed rule
    storyFunction: It changes conflict
    constraints:
      - Must hold
    status: confirmed
`, 'spec/world/rules.yaml');
    const canon = parseCanonDocument(JSON.stringify({
      canonFacts: [{
        id: 'canon.confirmed-fact',
        summary: 'Confirmed fact',
        evidence: [{ path: 'stories/demo/content/chapter-001.md' }],
        status: 'confirmed'
      }]
    }), 'spec/canon/facts.json');

    expect(world.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_WORLD_FACT_SOURCE_PATH' }),
      expect.objectContaining({ code: 'MISSING_WORLD_FACT_CONFIRMATION' })
    ]));
    expect(canon.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_CANON_FACT_CONFIRMATION' })
    ]));
  });
});
