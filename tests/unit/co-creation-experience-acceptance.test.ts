import programmingCastingFirstRound from '../fixtures/co-creation/programming-casting-first-round.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';
import {
  evaluateCoCreationExperience
} from '../../src/domain/co-creation-experience-acceptance.js';

describe('co-creation experience acceptance', () => {
  it('accepts the programming-casting first round as a fun co-creation experience', () => {
    const result = evaluateCoCreationExperience(programmingCastingFirstRound);

    expect(result.summary).toContain('通过');
    expect(result.issues).toEqual([]);
    expect(result.items.map(item => item.id)).toEqual([
      'entry-freedom',
      'low-burden-round',
      'interesting-choice-consequences',
      'creation-echo',
      'candidate-boundary',
      'plan-gate',
      'author-response-range',
      'manual-fun-review',
      'manual-burden-review',
      'manual-reference-review'
    ]);
    expect(result.items.filter(item => item.kind === 'automatic').every(item => item.status === 'pass')).toBe(true);
    expect(result.items.filter(item => item.kind === 'manual').every(item => item.status === 'manual')).toBe(true);
    expect(result.items.find(item => item.id === 'manual-fun-review')?.prompt)
      .toContain('是否像在创造小说世界');
  });

  it('flags regressions that turn co-creation into a heavy plan-first workflow', () => {
    const result = evaluateCoCreationExperience({
      story: '退化样例',
      flow: ['保存灵感', '写完整计划'],
      recommendedEntries: ['power'],
      entries: [{
        id: 'power',
        prompt: '填能力字段。',
        candidates: [{
          label: '标准答案',
          answer: '能力很强。',
          interestingChoice: {
            appeal: '很强。',
            cost: '',
            relationshipImpact: '',
            worldImpact: '',
            futureHook: '',
            confirmationBoundary: '写入正典。'
          }
        }]
      }],
      userResponseExamples: [{
        kind: 'confirm',
        text: '确认。'
      }],
      creationEcho: {
        created: '',
        stillOpen: '',
        next: ''
      },
      nextRecommendations: ['生成完整 creative-plan.md'],
      forbidden: []
    });

    expect(result.items.filter(item => item.kind === 'automatic').some(item => item.status === 'fail')).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ENTRY_FREEDOM_MISSING' }),
      expect.objectContaining({ code: 'ROUND_TOO_HEAVY_OR_THIN' }),
      expect.objectContaining({ code: 'CHOICE_CONSEQUENCES_MISSING' }),
      expect.objectContaining({ code: 'CREATION_ECHO_MISSING' }),
      expect.objectContaining({ code: 'CANDIDATE_BOUNDARY_MISSING' }),
      expect.objectContaining({ code: 'PLAN_GATE_MISSING' }),
      expect.objectContaining({ code: 'AUTHOR_RESPONSE_RANGE_MISSING' })
    ]));
  });
});
