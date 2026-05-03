import programmingCastingFirstRound from '../fixtures/co-creation/programming-casting-first-round.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';
import {
  validateFirstRoundScript
} from '../../src/domain/co-creation-first-round-script.js';

describe('co-creation first-round script', () => {
  it('keeps the programming-casting sample as a complete co-creation scenario', () => {
    const result = validateFirstRoundScript(programmingCastingFirstRound);

    expect(result.issues).toEqual([]);
    expect(result.script?.story).toBe('编程施法');
    expect(result.script?.flow).toEqual([
      '保存灵感',
      '推荐入口',
      '给候选',
      '用户选择/改写',
      '创作回声',
      '下一步推荐'
    ]);
    expect(result.script?.entries.map(entry => entry.id)).toEqual([
      'power',
      'stage',
      'faction'
    ]);
    expect(result.script?.entries.every(entry =>
      entry.candidates.length >= 2
      && entry.candidates.every(candidate =>
        candidate.interestingChoice.appeal.length > 0
        && candidate.interestingChoice.cost.length > 0
        && candidate.interestingChoice.relationshipImpact.length > 0
        && candidate.interestingChoice.worldImpact.length > 0
        && candidate.interestingChoice.futureHook.length > 0
        && candidate.interestingChoice.confirmationBoundary.includes('候选')
      )
    )).toBe(true);
    expect(result.script?.entries.find(entry => entry.id === 'faction')?.candidates.every(candidate =>
      candidate.powerStructure
      && candidate.powerStructure.resourceControl.length > 0
      && candidate.powerStructure.legitimacySource.length > 0
      && candidate.powerStructure.firstCollisionScene.length > 0
    )).toBe(true);
    expect(result.script?.userResponseExamples.map(item => item.kind)).toEqual([
      'confirm',
      'rewrite',
      'reject',
      'defer'
    ]);
    expect(result.script?.creationEcho).toEqual(expect.objectContaining({
      created: expect.stringContaining('能力边界'),
      stillOpen: expect.stringContaining('核心伙伴')
    }));
    expect(result.script?.forbidden).toEqual(expect.arrayContaining([
      expect.stringContaining('完整 creative-plan.md'),
      expect.stringContaining('未确认角色和势力')
    ]));
  });

  it('rejects scripts that skip choices or push a complete plan too early', () => {
    const result = validateFirstRoundScript({
      story: 'bad',
      flow: ['保存灵感', '写完整计划'],
      entries: [{
        id: 'power',
        candidates: []
      }],
      forbidden: []
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REQUIRED_FLOW_STEP' }),
      expect.objectContaining({ code: 'MISSING_REQUIRED_ENTRY' }),
      expect.objectContaining({ code: 'FIRST_ROUND_PLAN_TOO_EARLY' }),
      expect.objectContaining({ code: 'MISSING_CANDIDATES' }),
      expect.objectContaining({ code: 'MISSING_FORBIDDEN_BOUNDARY' })
    ]));
  });
});
