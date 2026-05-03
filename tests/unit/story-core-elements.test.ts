import { describe, expect, it } from 'vitest';
import type {
  ClarificationAnswer,
  ClarificationQuestion
} from '../../src/domain/clarification.js';
import {
  evaluateStoryCoreElements,
  getPlanBlockingCoreElements
} from '../../src/domain/story-core-elements.js';

const question = (
  id: string,
  topic: string,
  text: string,
  required = true
): ClarificationQuestion => ({
  id,
  stage: 'specify',
  topic,
  question: text,
  whyItMatters: '影响故事共创成熟度。',
  type: 'textarea',
  required,
  options: [],
  exampleAnswers: [],
  dependsOn: []
});

const answer = (
  questionId: string,
  value: string,
  source: ClarificationAnswer['source'] = 'user-explicit',
  confirmed = true
): ClarificationAnswer => ({
  questionId,
  answer: value,
  source,
  confidence: source === 'ai-suggested' ? 0.6 : 1,
  confirmed,
  createdAt: '2026-05-03T00:00:00.000Z',
  updatedAt: '2026-05-03T00:00:00.000Z'
});

const byId = (items: ReturnType<typeof evaluateStoryCoreElements>) =>
  new Map(items.map(item => [item.id, item]));

describe('story core elements', () => {
  it('evaluates the programming-casting sample before downstream planning', () => {
    const elements = byId(evaluateStoryCoreElements({
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界；轻松冒险、慢热感情、文明级威胁。',
      questions: [
        question('protagonist.identity', 'protagonist', '主角是谁？'),
        question('partner.core', 'partner', '核心伙伴是谁？'),
        question('stage.first', 'stage', '第一舞台在哪里？'),
        question('magic-system.style', 'magic-system', '编程施法更偏硬规则，还是轻量隐喻？'),
        question('faction.conflict', 'faction', '第一卷的势力冲突是什么？'),
        question('threat.silence', 'threat', '文明级威胁最早以什么小异常出现？')
      ],
      answers: [
        answer('protagonist.identity', '晏无是工科马列青年，穿越到剑与魔法世界。'),
        answer('magic-system.style', '编程施法偏轻量隐喻。'),
        answer('threat.silence', '第三次寂静正在逼近人类文明，前两次分别吞没远古神族和高等精灵文明。')
      ]
    }));

    expect(elements.get('protagonist')).toMatchObject({
      status: 'partial',
      label: '主角'
    });
    expect(elements.get('power')).toMatchObject({
      status: 'confirmed',
      label: '能力体系'
    });
    expect(elements.get('longThreat')).toMatchObject({
      status: 'confirmed',
      label: '长线威胁'
    });
    expect(elements.get('partner')).toMatchObject({
      status: 'missing',
      label: '核心伙伴'
    });
    expect(elements.get('stage')).toMatchObject({
      status: 'missing',
      label: '第一舞台'
    });
    expect(elements.get('factionConflict')).toMatchObject({
      status: 'missing',
      label: '势力与冲突'
    });
  });

  it('keeps AI candidates and deferred answers out of plan-ready elements', () => {
    const elements = evaluateStoryCoreElements({
      premise: '异界穿越。',
      questions: [
        question('partner.core', 'partner', '核心伙伴是谁？'),
        question('stage.first', 'stage', '第一舞台在哪里？')
      ],
      answers: [
        answer('partner.core', '候选伙伴是一名被学院驱逐的符文学徒。', 'ai-suggested', false),
        answer('stage.first', '稍后决定')
      ]
    });

    expect(byId(elements).get('partner')).toMatchObject({ status: 'suggested' });
    expect(byId(elements).get('stage')).toMatchObject({ status: 'deferred' });
    expect(getPlanBlockingCoreElements(elements).map(item => item.id)).toEqual(expect.arrayContaining([
      'partner',
      'stage'
    ]));
  });

  it('requires the first stage to contain pressure that changes character action', () => {
    const encyclopedic = byId(evaluateStoryCoreElements({
      premise: '学院冒险。',
      questions: [
        question('stage.first', 'stage', '第一舞台在哪里？')
      ],
      answers: [
        answer('stage.first', '艾尔学院历史悠久，建筑宏伟，课程覆盖魔法理论。')
      ]
    }));

    const pressured = byId(evaluateStoryCoreElements({
      premise: '学院冒险。',
      questions: [
        question('stage.first', 'stage', '第一舞台在哪里？')
      ],
      answers: [
        answer('stage.first', '艾尔学院垄断法术专利，贫民学生要背债入学，晏无的每次施法都会触发审查代价。')
      ]
    }));

    expect(encyclopedic.get('stage')).toMatchObject({
      status: 'partial',
      qualityNotes: expect.arrayContaining([
        expect.stringContaining('利益结构或代价')
      ])
    });
    expect(pressured.get('stage')).toMatchObject({
      status: 'confirmed'
    });
  });
});
