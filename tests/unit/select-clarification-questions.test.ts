import { describe, expect, it } from 'vitest';
import {
  loadClarificationExampleBranches,
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

  it('loads question-level example branches with flavor, tradeoffs, and downstream impact', async () => {
    const result = await loadClarificationQuestionPacks();
    const magic = result.packs.find(pack => pack.id === 'magic-system');
    const ruleHardness = magic?.questions.find(question => question.id === 'magic.rule-hardness');
    const metaphorBranch = ruleHardness?.exampleBranches?.find(branch => branch.label === '轻量隐喻');

    expect(ruleHardness?.choiceImpact).toBe('high');
    expect(metaphorBranch).toEqual(expect.objectContaining({
      label: '轻量隐喻',
      answer: expect.stringContaining('轻量隐喻'),
      flavor: expect.stringContaining('轻松'),
      tradeoffs: expect.arrayContaining([expect.stringContaining('技术辨识度')]),
      downstreamImpact: expect.stringContaining('阅读承诺'),
      recommendedFor: expect.arrayContaining([expect.stringContaining('轻松冒险')])
    }));
    expect(metaphorBranch?.interestingChoice?.appeal).toContain('轻松');
    expect(metaphorBranch?.interestingChoice?.cost).toContain('技术辨识度');
    expect(metaphorBranch?.interestingChoice?.relationshipImpact).toContain('伙伴');
    expect(metaphorBranch?.interestingChoice?.worldImpact).toContain('能力边界');
    expect(metaphorBranch?.interestingChoice?.futureHook).toContain('失败代价');
    expect(metaphorBranch?.interestingChoice?.confirmationBoundary).toContain('候选');
    expect(ruleHardness?.exampleBranches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: '中度规则',
        downstreamImpact: expect.stringContaining('能力边界')
      }),
      expect.objectContaining({
        label: '硬规则',
        tradeoffs: expect.arrayContaining([expect.stringContaining('解释负担')])
      })
    ]));
  });

  it('loads built-in example branch packs', async () => {
    const result = await loadClarificationExampleBranches();

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
    expect(result.packs.every(pack => pack.branches.length >= 3)).toBe(true);
    expect(result.packs.flatMap(pack => pack.branches).some(branch => branch.label.includes('作者主导'))).toBe(true);
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
    expect(selection.selectedQuestions.slice(0, 4).map(item => item.question.topic)).toEqual([
      'protagonist',
      'setting',
      'magic-system',
      'threat'
    ]);
    expect(selection.interviewStages.map(stage => stage.id)).toEqual([
      'seed',
      'core-cast',
      'stage',
      'power',
      'conflict',
      'promise',
      'growth-route',
      'voice'
    ]);
    expect(selection.interviewStages.filter(stage => stage.status === 'active').map(stage => stage.id)).toEqual(expect.arrayContaining([
      'core-cast',
      'stage',
      'power'
    ]));
    for (const item of selection.selectedQuestions) {
      expect(item.question.whyItMatters.trim()).not.toBe('');
      expect(item.question.exampleAnswers.length).toBeGreaterThanOrEqual(2);
    }
    expect(selection.selectedQuestions.some(item =>
      (item.question.exampleBranches ?? []).some(branch =>
        branch.flavor.trim().length > 0
        && branch.downstreamImpact.trim().length > 0
        && branch.tradeoffs.length > 0
      )
    )).toBe(true);
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
      'continue-interview',
      'generate-candidates',
      'preview-specify',
      'pause-draft'
    ]);
  });

  it('keeps partner and faction ready for the next round after the first core pass', async () => {
    const { packs } = await loadClarificationQuestionPacks();
    const selection = selectClarificationQuestions(
      '18+ 玄幻、异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      packs,
      { mode: 'fewer', maxQuestions: 6 }
    );

    expect(selection.selectedQuestions.map(item => item.question.id)).toEqual(expect.arrayContaining([
      'core.partner',
      'core.faction-conflict'
    ]));
  });

  it('can return copyable examples without asking questions', async () => {
    const { packs } = await loadClarificationQuestionPacks();
    const { packs: exampleBranchPacks } = await loadClarificationExampleBranches();
    const selection = selectClarificationQuestions(
      '异界穿越、轻松冒险、编程施法',
      packs,
      { mode: 'examples-only', maxExamples: 3, exampleBranchPacks }
    );

    expect(selection.mode).toBe('examples-only');
    expect(selection.selectedQuestions).toEqual([]);
    expect(selection.exampleBranches).toHaveLength(3);
    expect(selection.exampleBranches[0].branch.label).toContain('作者主导');
    expect(selection.copyableExamples).toHaveLength(3);
    expect(selection.copyableExamples.every(example => example.trim().length > 0)).toBe(true);
  });

  it('returns stable different example branches for the same input', async () => {
    const { packs } = await loadClarificationQuestionPacks();
    const { packs: exampleBranchPacks } = await loadClarificationExampleBranches();
    const input = '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。建设流和思想改造是支撑工具，不是纯种田文。';

    const first = selectClarificationQuestions(input, packs, { exampleBranchPacks, maxExamples: 3 });
    const second = selectClarificationQuestions(input, packs, { exampleBranchPacks, maxExamples: 3 });

    expect(first.exampleBranches.map(item => item.branch.label)).toEqual(second.exampleBranches.map(item => item.branch.label));
    expect(new Set(first.exampleBranches.map(item => item.branch.tone)).size).toBeGreaterThanOrEqual(2);
  });
});
