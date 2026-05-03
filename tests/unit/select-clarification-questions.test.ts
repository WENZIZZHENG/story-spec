import { describe, expect, it } from 'vitest';
import {
  loadClarificationQuestionPacks,
  selectClarificationQuestions
} from '../../src/application/select-clarification-questions.js';

describe('selectClarificationQuestions', () => {
  it('loads built-in clarification question packs', async () => {
    const result = await loadClarificationQuestionPacks();

    expect(result.issues).toEqual([]);
    expect(result.packs.map(pack => pack.id).sort()).toEqual([
      'civilization-threat',
      'core',
      'cozy-adventure',
      'kingdom-building-support',
      'magic-system',
      'portal-fantasy',
      'slow-burn-romance'
    ]);
  });

  it('selects multiple relevant packs for a mixed low-info premise', async () => {
    const { packs } = await loadClarificationQuestionPacks();
    const selection = selectClarificationQuestions(
      '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。建设流和思想改造是支撑工具，不是纯种田文。',
      packs
    );

    expect(selection.issues).toEqual([]);
    expect(selection.selectedQuestions.length).toBeGreaterThanOrEqual(6);
    expect(selection.selectedQuestions.length).toBeLessThanOrEqual(10);
    expect(selection.matchedPacks).toEqual(expect.arrayContaining([
      'core',
      'portal-fantasy',
      'magic-system',
      'slow-burn-romance',
      'civilization-threat',
      'cozy-adventure',
      'kingdom-building-support'
    ]));
    expect(selection.selectedQuestions.map(item => item.packId)).toEqual(expect.arrayContaining([
      'portal-fantasy',
      'magic-system',
      'slow-burn-romance',
      'civilization-threat',
      'cozy-adventure',
      'kingdom-building-support'
    ]));
    for (const item of selection.selectedQuestions) {
      expect(item.question.whyItMatters.trim()).not.toBe('');
      expect(item.question.exampleAnswers.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('supports fewer questions for a gentle first round', async () => {
    const { packs } = await loadClarificationQuestionPacks();
    const selection = selectClarificationQuestions(
      '异界穿越、编程施法、慢热感情、文明级威胁',
      packs,
      { mode: 'fewer' }
    );

    expect(selection.mode).toBe('fewer');
    expect(selection.selectedQuestions.length).toBeLessThanOrEqual(6);
    expect(selection.nextActions.map(action => action.id)).toEqual([
      'more-questions',
      'examples-only',
      'answer-selected'
    ]);
  });

  it('can return copyable examples without asking questions', async () => {
    const { packs } = await loadClarificationQuestionPacks();
    const selection = selectClarificationQuestions(
      '异界穿越、轻松冒险、编程施法',
      packs,
      { mode: 'examples-only', maxExamples: 3 }
    );

    expect(selection.mode).toBe('examples-only');
    expect(selection.selectedQuestions).toEqual([]);
    expect(selection.copyableExamples).toHaveLength(3);
    expect(selection.copyableExamples.every(example => example.trim().length > 0)).toBe(true);
  });
});
