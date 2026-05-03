import { describe, expect, it } from 'vitest';
import {
  CO_CREATION_ENTRYPOINTS,
  type StoryCoCreationEntrypointId
} from '../../src/domain/co-creation-workbench.js';

const CORE_ENTRY_IDS: readonly StoryCoCreationEntrypointId[] = [
  'protagonist',
  'partner',
  'stage',
  'power',
  'faction',
  'conflict'
];

describe('co-creation entry cards', () => {
  it('defines complete reusable cards for the six core co-creation entries', () => {
    const entries = new Map(CO_CREATION_ENTRYPOINTS.map(entry => [entry.id, entry]));

    for (const id of CORE_ENTRY_IDS) {
      const card = entries.get(id);

      expect(card, `${id} entry card`).toBeDefined();
      expect(card?.title.length).toBeGreaterThan(0);
      expect(card?.whenToUse.length).toBeGreaterThan(0);
      expect(card?.openingQuestions.length).toBeGreaterThanOrEqual(3);
      expect(card?.candidateArtifacts.length).toBeGreaterThanOrEqual(2);
      expect(card?.canonBoundary).toContain('候选');
      expect(card?.nextRecommendations.length).toBeGreaterThanOrEqual(1);
      expect(card?.maturityImpact.length).toBeGreaterThanOrEqual(1);
      expect(card?.interestingChoices.length).toBeGreaterThanOrEqual(2);

      for (const choice of card?.interestingChoices ?? []) {
        expect(choice.appeal.length).toBeGreaterThan(0);
        expect(choice.cost.length).toBeGreaterThan(0);
        expect(choice.relationshipImpact.length).toBeGreaterThan(0);
        expect(choice.worldImpact.length).toBeGreaterThan(0);
        expect(choice.futureHook.length).toBeGreaterThan(0);
        expect(choice.confirmationBoundary).toContain('候选');
      }

      for (const impact of card?.maturityImpact ?? []) {
        expect(impact.coreElement.length).toBeGreaterThan(0);
        expect(impact.priority).toBeGreaterThan(0);
        expect(impact.reason.length).toBeGreaterThan(0);
      }
    }
  });
});
