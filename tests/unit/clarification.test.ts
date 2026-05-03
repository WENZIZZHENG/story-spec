import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseClarificationAnswerSet,
  parseClarificationQuestionSet,
  validateClarificationSession,
  validateCreativeDecisions
} from '../../src/domain/clarification-schema.js';

const fixturePath = (name: string): string =>
  path.join(process.cwd(), 'tests', 'fixtures', 'clarification', name);

describe('clarification domain schema', () => {
  it('parses structured clarification questions with dependsOn rules', async () => {
    const content = await readFile(fixturePath('question-set.yaml'), 'utf-8');
    const result = parseClarificationQuestionSet(content, 'question-set.yaml');

    expect(result.issues).toEqual([]);
    expect(result.questions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'story.core-premise',
        type: 'textarea',
        required: true,
        exampleAnswers: expect.arrayContaining([
          '我想保留“编程施法”，但主角先是调试小法术，不马上拯救世界。'
        ]),
        exampleBranches: [
          expect.objectContaining({
            label: '轻松冒险',
            answer: expect.stringContaining('小冒险'),
            flavor: expect.stringContaining('轻快'),
            downstreamImpact: expect.stringContaining('阅读承诺'),
            recommendedFor: expect.arrayContaining(['慢热开局'])
          })
        ]
      }),
      expect.objectContaining({
        id: 'magic.rule-hardness',
        dependsOn: [{ questionId: 'story.core-premise', answerIncludes: '编程施法' }]
      })
    ]));
  });

  it('reports required clarification questions that do not have answers', async () => {
    const questions = parseClarificationQuestionSet(
      await readFile(fixturePath('question-set.yaml'), 'utf-8'),
      'question-set.yaml'
    ).questions;
    const answers = parseClarificationAnswerSet(
      await readFile(fixturePath('low-info-answers.yaml'), 'utf-8'),
      'low-info-answers.yaml'
    ).answers;

    const issues = validateClarificationSession({ questions, answers });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_REQUIRED_CLARIFICATION_ANSWER',
        path: 'questions[story.core-premise]'
      }),
      expect.objectContaining({
        code: 'MISSING_REQUIRED_CLARIFICATION_ANSWER',
        path: 'questions[protagonist.identity]'
      })
    ]));
  });

  it('accepts confirmed user answers as enough for required questions', async () => {
    const questions = parseClarificationQuestionSet(
      await readFile(fixturePath('question-set.yaml'), 'utf-8'),
      'question-set.yaml'
    ).questions;
    const answers = parseClarificationAnswerSet(
      await readFile(fixturePath('confirmed-answers.yaml'), 'utf-8'),
      'confirmed-answers.yaml'
    ).answers;

    const issues = validateClarificationSession({ questions, answers });

    expect(issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REQUIRED_CLARIFICATION_ANSWER' })
    ]));
  });

  it('blocks creative decisions sourced only from unconfirmed AI suggestions', async () => {
    const answers = parseClarificationAnswerSet(
      await readFile(fixturePath('ai-suggested-answers.yaml'), 'utf-8'),
      'ai-suggested-answers.yaml'
    ).answers;

    const issues = validateCreativeDecisions([
      {
        id: 'decision.threat-shape',
        label: '文明级威胁形态',
        value: '沉睡的旧世界运行时即将重启',
        sourceAnswers: ['threat.shape'],
        status: 'pending',
        canonImpact: 'high'
      }
    ], answers);

    expect(issues).toEqual([expect.objectContaining({
      code: 'UNCONFIRMED_AI_SUGGESTION_AS_DECISION',
      path: 'decisions[decision.threat-shape].sourceAnswers[threat.shape]'
    })]);
  });

  it('warns when high-impact choices lack the full interesting-choice dimensions', () => {
    const result = parseClarificationQuestionSet(`questions:
  - id: magic.rule-hardness
    stage: specify
    topic: magic-system
    question: 编程施法更偏硬规则还是轻量隐喻？
    whyItMatters: 影响能力爽点和世界规则。
    type: single-choice
    required: true
    choiceImpact: high
    exampleAnswers:
      - 硬规则。
      - 轻量隐喻。
    exampleBranches:
      - label: 轻量隐喻
        answer: 编程施法偏轻量隐喻。
        flavor: 轻松。
        tradeoffs:
          - 技术辨识度会弱一些。
        downstreamImpact: 能力边界要靠失败代价呈现。
`, 'high-impact.yaml');

    expect(result.questions[0]).toEqual(expect.objectContaining({
      choiceImpact: 'high',
      exampleBranches: [
        expect.objectContaining({
          interestingChoice: expect.objectContaining({
            appeal: '轻松。',
            cost: '技术辨识度会弱一些。'
          })
        })
      ]
    }));
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'INCOMPLETE_INTERESTING_CHOICE',
        path: 'high-impact.yaml#questions[0].exampleBranches[0].relationshipImpact'
      }),
      expect.objectContaining({
        code: 'INCOMPLETE_INTERESTING_CHOICE',
        path: 'high-impact.yaml#questions[0].exampleBranches[0].futureHook'
      }),
      expect.objectContaining({
        code: 'INCOMPLETE_INTERESTING_CHOICE',
        path: 'high-impact.yaml#questions[0].exampleBranches[0].confirmationBoundary'
      })
    ]));
  });

  it('warns when a high-impact faction branch lacks power-structure fields', () => {
    const result = parseClarificationQuestionSet(`questions:
  - id: core.faction-conflict
    stage: specify
    topic: faction
    question: 第一卷最先撞上的势力或冲突是什么？
    whyItMatters: 势力需要有利益逻辑。
    type: textarea
    required: false
    choiceImpact: high
    exampleAnswers:
      - 学院垄断咒文许可。
      - 地方贵族压下魔法事故。
    exampleBranches:
      - label: 学院许可
        answer: 学院垄断咒文许可。
        flavor: 知识垄断。
        tradeoffs:
          - 需要写出学院合理性。
        downstreamImpact: 成功路线围绕突破许可推进。
        recommendedFor:
          - 学院工坊
        interestingChoice:
          appeal: 知识垄断和规则学习同台出现。
          cost: 容易偏制度讨论。
          relationshipImpact: 伙伴可能来自学院内部。
          worldImpact: 许可制度会影响普通施法者。
          futureHook: 下一轮确认第一次越权救人。
          confirmationBoundary: 候选，确认后才进入 World Bible。
        powerStructure:
          name: 艾尔学院
          resourceControl: 咒文许可和考试资格
`, 'faction.yaml');

    expect(result.questions[0].exampleBranches?.[0].powerStructure).toEqual(expect.objectContaining({
      name: '艾尔学院',
      resourceControl: '咒文许可和考试资格'
    }));
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'INCOMPLETE_FACTION_POWER_STRUCTURE',
        path: 'faction.yaml#questions[0].exampleBranches[0].powerStructure.legitimacySource'
      }),
      expect.objectContaining({
        code: 'INCOMPLETE_FACTION_POWER_STRUCTURE',
        path: 'faction.yaml#questions[0].exampleBranches[0].powerStructure.firstCollisionScene'
      })
    ]));
  });

  it('reports invalid question types and invalid confidence values', () => {
    const questionResult = parseClarificationQuestionSet(`questions:
  - id: bad.question
    stage: specify
    topic: premise
    question: Bad?
    whyItMatters: test
    type: dropdown
    required: true
`, 'bad-question.yaml');
    const answerResult = parseClarificationAnswerSet(`answers:
  - questionId: bad.question
    answer: x
    source: user-explicit
    confidence: 2
    confirmed: true
    createdAt: 2026-05-03T00:00:00.000Z
    updatedAt: 2026-05-03T00:00:00.000Z
`, 'bad-answer.yaml');

    expect(questionResult.issues).toEqual([expect.objectContaining({
      code: 'INVALID_CLARIFICATION_QUESTION_TYPE',
      path: 'bad-question.yaml#questions[0].type'
    })]);
    expect(answerResult.issues).toEqual([expect.objectContaining({
      code: 'INVALID_CLARIFICATION_ANSWER_CONFIDENCE',
      path: 'bad-answer.yaml#answers[0].confidence'
    })]);
  });
});
