import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createCreativeReport,
  renderCreativeReport
} from '../../src/application/creative-report.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('creative report', () => {
  it('outputs a one-screen structured volume plan digest without promoting candidates', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-volume-digest');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'volume-demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# volume demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'volume-demo',
      premise: '第一卷是学院维修库里的编程施法冒险。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [],
      answers: []
    }, { spaces: 2 });
    await fileSystem.writeJson(path.join(storyPath, 'volume-plan-digest.json'), {
      schemaVersion: '1.0',
      volume: 1,
      oneSentenceGoal: {
        status: 'confirmed',
        text: '晏无在 12 章内证明编程施法能修复民生法器，并把第三次寂静的第一枚异常钉住。',
        evidence: ['stories/volume-demo/creative-plan.md#第一卷目标']
      },
      threeActSummary: [
        {
          act: 'setup',
          label: '第一幕',
          chapters: '1-3',
          status: 'confirmed',
          summary: '维修库事故暴露知识垄断，晏无被迫公开调试思路。'
        },
        {
          act: 'confrontation',
          label: '第二幕',
          chapters: '4-9',
          status: 'confirmed',
          summary: '学院和工坊争夺修复权，民生法器连续失灵。'
        },
        {
          act: 'resolution',
          label: '第三幕',
          chapters: '10-12',
          status: 'confirmed',
          summary: '晏无用最小可行术式稳定城区核心，但只确认寂静的一角。'
        }
      ],
      chapterRhythm: Array.from({ length: 12 }, (_, index) => ({
        chapter: index + 1,
        status: index === 6 ? 'candidate' : 'confirmed',
        rhythm: index < 3 ? '建立' : index < 9 ? '升级' : '释放',
        function: `章节功能 ${index + 1}`,
        emotionalBeat: `情绪推进 ${index + 1}`,
        plotTurn: `剧情转折 ${index + 1}`
      })),
      characterArcs: [
        {
          character: '晏无',
          status: 'confirmed',
          start: '把施法当工程问题',
          turn: '承认异界规则也有政治代价',
          end: '愿意为公开修复方案承担风险',
          evidence: ['stories/volume-demo/creative-plan.md#晏无']
        },
        {
          character: '莉安',
          status: 'needs-confirmation',
          start: '学院观察者',
          turn: '资料不足',
          end: '资料不足',
          evidence: []
        }
      ],
      plotCurve: [
        { chapterRange: '1-3', status: 'confirmed', tension: '从事故钩子升到学院介入', payoff: '证明调试法可用' },
        { chapterRange: '4-9', status: 'confirmed', tension: '权力争夺和连续失灵抬升', payoff: '锁定异常来源' },
        { chapterRange: '10-12', status: 'confirmed', tension: '城区核心失控达到峰值', payoff: '稳定核心但留下长线威胁' }
      ],
      relationships: [
        {
          participants: ['晏无', '莉安'],
          status: 'candidate',
          dynamic: '从监视与试探到有限互信',
          conflict: '是否公开编程施法原理',
          nextConfirmation: '确认第一卷只到有限互信，不进入表白。'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'volume-demo'
    });
    const rendered = renderCreativeReport(result);

    expect(result.volumePlanDigest).toMatchObject({
      available: true,
      sourcePath: path.join(storyPath, 'volume-plan-digest.json'),
      volume: 1,
      oneSentenceGoal: {
        status: 'confirmed',
        text: expect.stringContaining('12 章')
      },
      threeActSummary: [
        expect.objectContaining({ act: 'setup', status: 'confirmed' }),
        expect.objectContaining({ act: 'confrontation', status: 'confirmed' }),
        expect.objectContaining({ act: 'resolution', status: 'confirmed' })
      ],
      characterArcs: expect.arrayContaining([
        expect.objectContaining({
          character: '莉安',
          status: 'needs-confirmation',
          evidence: []
        })
      ]),
      relationships: [
        expect.objectContaining({
          participants: ['晏无', '莉安'],
          status: 'candidate'
        })
      ]
    });
    expect(result.volumePlanDigest.chapterRhythm).toHaveLength(12);
    expect(result.volumePlanDigest.chapterRhythm[6]).toEqual(expect.objectContaining({
      chapter: 7,
      status: 'candidate'
    }));
    expect(result.volumePlanDigest.nextActions).toEqual(expect.arrayContaining([
      expect.stringContaining('莉安'),
      expect.stringContaining('晏无 / 莉安')
    ]));
    expect(rendered).toContain('第一卷一屏摘要');
    expect(rendered).toContain('第一卷一句话目标 [confirmed]');
    expect(rendered).toContain('三幕结构摘要');
    expect(rendered).toContain('12 章节奏/章节功能表');
    expect(rendered).toContain('核心角色弧线');
    expect(rendered).toContain('剧情起伏');
    expect(rendered).toContain('人物关系概况');
    expect(rendered).toContain('卷计划视图');
    expect(rendered).toContain('flowchart LR');
    expect(rendered).toContain('第7章 [candidate]');
    expect(rendered).toContain('莉安 [needs-confirmation]');
    expect(rendered).toContain('晏无 / 莉安 [candidate]');
    expect(rendered).not.toContain('莉安 [confirmed]');
    expect(rendered.length).toBeLessThan(9000);
  });

  it('marks missing volume digest fields as待确认 without inventing facts', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-volume-digest-missing');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'missing-volume-demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# missing volume demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'missing-volume-demo',
      premise: '第一卷目标还在共创。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [],
      answers: []
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'missing-volume-demo'
    });
    const rendered = renderCreativeReport(result);

    expect(result.volumePlanDigest).toMatchObject({
      available: false,
      oneSentenceGoal: {
        status: 'missing',
        text: '待确认'
      },
      threeActSummary: [
        expect.objectContaining({ act: 'setup', status: 'missing', summary: '资料不足' }),
        expect.objectContaining({ act: 'confrontation', status: 'missing', summary: '资料不足' }),
        expect.objectContaining({ act: 'resolution', status: 'missing', summary: '资料不足' })
      ],
      chapterRhythm: expect.arrayContaining([
        expect.objectContaining({ chapter: 1, status: 'missing', function: '待确认' }),
        expect.objectContaining({ chapter: 12, status: 'missing', function: '待确认' })
      ]),
      characterArcs: [
        expect.objectContaining({ character: '核心角色', status: 'missing', start: '资料不足' })
      ],
      plotCurve: [
        expect.objectContaining({ chapterRange: '1-12', status: 'missing', tension: '资料不足' })
      ],
      relationships: [
        expect.objectContaining({ participants: [], status: 'missing', dynamic: '资料不足' })
      ]
    });
    expect(result.volumePlanDigest.nextActions).toContain('补齐 volume-plan-digest.json，或先运行 storyspec preview plan 生成保留缺口的计划草案。');
    expect(rendered).toContain('第一卷一句话目标 [missing]：待确认');
    expect(rendered).toContain('人物关系概况');
    expect(rendered).toContain('资料不足');
    expect(rendered).not.toContain('自动补全');
  });

  it('separates confirmed user choices, pending questions, AI suggestions, and drift issues', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'memory', 'author-profile.json'), {
      schemaVersion: '1.0',
      updatedAt: '2026-05-04T08:00:00.000Z',
      notes: [],
      entries: [
        {
          id: 'pref.genre',
          category: 'genre',
          label: '题材偏好',
          value: '轻松冒险优先，文明级威胁慢慢浮现',
          status: 'confirmed',
          source: 'user-explicit',
          evidence: ['用户确认'],
          createdAt: '2026-05-04T08:00:00.000Z',
          updatedAt: '2026-05-04T08:00:00.000Z',
          confirmedAt: '2026-05-04T08:00:00.000Z'
        }
      ]
    }, { spaces: 2 });
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越、慢热感情、文明级威胁',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'core.premise',
          stage: 'specify',
          topic: 'premise',
          question: '故事最想保留什么？',
          whyItMatters: '决定创作核心。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['轻松冒险。', '文明谜团。'],
          dependsOn: []
        },
        {
          id: 'romance.boundary',
          stage: 'specify',
          topic: 'relationship',
          question: '慢热感情边界是什么？',
          whyItMatters: '避免过早定关系。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['第一卷互相信任。', '第二卷才表白。'],
          dependsOn: []
        },
        {
          id: 'threat.shape',
          stage: 'specify',
          topic: 'threat',
          question: '威胁形态是什么？',
          whyItMatters: '影响长线结构。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['旧文明运行时重启。', '群星协议崩塌。'],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.premise',
          answer: '编程施法只是工具，开局仍然是轻松冒险。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'threat.shape',
          answer: '旧文明运行时重启',
          source: 'ai-suggested',
          confidence: 0.6,
          confirmed: false,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '文明级威胁是旧文明运行时重启。');

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'demo'
    });

    expect(result.confirmed).toEqual([
      expect.objectContaining({ questionId: 'core.premise' })
    ]);
    expect(result.pendingQuestions).toEqual([
      expect.objectContaining({ questionId: 'romance.boundary' })
    ]);
    expect(result.aiSuggestions).toEqual([
      expect.objectContaining({ questionId: 'threat.shape' })
    ]);
    expect(result.driftIssues).toEqual([
      expect.objectContaining({
        code: 'CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION'
      })
    ]);
    expect(result.nextActions).toContain('storyspec review --panel continuity');
    expect(result.storySkeleton.created).toEqual(expect.arrayContaining([
      expect.stringContaining('阅读承诺')
    ]));
    expect(result.storySkeleton.created.join('\n')).not.toContain('旧文明运行时重启');
    expect(result.authorProfile.activeHints).toContain('[confirmed] 题材偏好：轻松冒险优先，文明级威胁慢慢浮现');
    expect(result.storySkeleton.summary).not.toContain('轻松冒险优先，文明级威胁慢慢浮现');

    const rendered = renderCreativeReport(result);
    expect(rendered).toContain('作者画像回填');
    expect(rendered).toContain('只影响推荐和示例，不进入故事正典');
    expect(rendered).toContain('core.premise [作者确认]：编程施法只是工具');
    expect(rendered).toContain('romance.boundary [待澄清]：慢热感情边界是什么？');
    expect(rendered).toContain('threat.shape [AI 候选]：旧文明运行时重启');
  });

  it('renders a core element panel for co-creating programming-casting', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-core');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '编程施法');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 编程施法');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '编程施法',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界；轻松冒险、慢热感情、文明级威胁。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'protagonist.identity',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响主角视角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'partner.core',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系张力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'stage.first',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界规则的第一眼呈现。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'magic-system.style',
          stage: 'specify',
          topic: 'magic-system',
          question: '编程施法更偏硬规则，还是轻量隐喻？',
          whyItMatters: '影响能力边界。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'faction.conflict',
          stage: 'specify',
          topic: 'faction',
          question: '第一卷的势力冲突是什么？',
          whyItMatters: '影响行动压力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'threat.silence',
          stage: 'specify',
          topic: 'threat',
          question: '文明级威胁最早以什么小异常出现？',
          whyItMatters: '影响长线揭示。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'protagonist.identity',
          answer: '晏无是工科马列青年，穿越到剑与魔法世界。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'magic-system.style',
          answer: '编程施法偏轻量隐喻。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'threat.silence',
          answer: '第三次寂静正在逼近人类文明，前两次分别吞没远古神族和高等精灵文明。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });
    const rendered = renderCreativeReport(result);

    expect(result.coreElements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'protagonist', label: '主角', status: 'partial' }),
      expect.objectContaining({ id: 'power', label: '能力体系', status: 'confirmed' }),
      expect.objectContaining({ id: 'longThreat', label: '长线威胁', status: 'confirmed' }),
      expect.objectContaining({ id: 'partner', label: '核心伙伴', status: 'missing' }),
      expect.objectContaining({ id: 'stage', label: '第一舞台', status: 'missing' }),
      expect.objectContaining({ id: 'factionConflict', label: '势力与冲突', status: 'missing' })
    ]));
    expect(rendered).toContain('核心要素面板');
    expect(rendered).toContain('主角：部分确认 [部分确认]');
    expect(rendered).toContain('核心伙伴：缺失 [待澄清]');
    expect(rendered).toContain('第一舞台：缺失');
    expect(rendered).toContain('势力与冲突：缺失');
    expect(result.storySkeleton.summary).toContain('晏无');
    expect(result.storySkeleton.summary).toContain('编程施法');
    expect(result.storySkeleton.summary).toContain('第三次寂静');
    expect(result.funPrompts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: '核心伙伴',
        prompt: expect.stringContaining('伙伴会怎样挑战主角'),
        command: 'storyspec interview 编程施法'
      }),
      expect.objectContaining({
        label: '第一舞台',
        prompt: expect.stringContaining('压迫或诱惑')
      }),
      expect.objectContaining({
        label: '势力与冲突',
        prompt: expect.stringContaining('第一卷')
      })
    ]));
    expect(result.nextActions).toContain('先确认核心伙伴：运行 storyspec interview 编程施法，或直接回答“伙伴会怎样挑战主角？”');
    expect(rendered).toContain('你已经创建的小说骨架');
    expect(rendered).toContain('成熟度');
    expect(rendered).toContain('可继续探索的乐趣点');
  });

  it('calls out a core partner who lacks desire and tension', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-partner-depth');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'slow-burn-demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# slow burn');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'slow-burn-demo',
      premise: '异界穿越、慢热感情。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'core.partner',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '伙伴需要挑战主角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.partner',
          answer: '伙伴是引路人，负责解释异界规则并辅助主角。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'slow-burn-demo'
    });
    const rendered = renderCreativeReport(result);

    expect(result.coreElements).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'partner',
        status: 'partial',
        qualityNotes: expect.arrayContaining([expect.stringContaining('功能位')])
      })
    ]));
    expect(rendered).toContain('功能位');
    expect(result.funPrompts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: '核心伙伴',
        prompt: expect.stringContaining('伙伴会怎样挑战主角')
      })
    ]));
  });

  it('distinguishes a faction name from a usable power structure', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-faction-structure');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'faction-demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# faction demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'faction-demo',
      premise: '异界穿越、学院势力。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'core.faction-conflict',
          stage: 'specify',
          topic: 'faction',
          question: '第一卷的势力冲突是什么？',
          whyItMatters: '需要权力结构。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.faction-conflict',
          answer: '反派是皇家魔法学院。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'faction-demo'
    });
    const faction = result.coreElements.find(element => element.id === 'factionConflict');
    const rendered = renderCreativeReport(result);

    expect(faction).toEqual(expect.objectContaining({
      status: 'partial',
      qualityNotes: expect.arrayContaining([
        expect.stringContaining('只有势力或反派名称')
      ])
    }));
    expect(rendered).toContain('只有势力或反派名称');
    expect(rendered).toContain('资源控制');
    expect(rendered).toContain('合法性来源');
  });

  it('shows active what-if branches as creative directions rather than hidden files', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-branches');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'branch-demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# branch demo');
    await fileSystem.writeJson(path.join(storyPath, 'branches', '提前揭示身份', 'branch.json'), {
      id: '提前揭示身份',
      base: 'main',
      title: '提前揭示身份',
      premise: '主角在第一场事故后立刻暴露穿越者和编程施法者身份，换取学院临时信任。',
      changedScenes: ['scene-001'],
      changedCanonFacts: ['canon.identity'],
      impactSummary: '分支将影响 1 个 scene、1 个 canon fact，promote 前必须人工确认影响清单。',
      status: 'exploring',
      createdAt: '2026-05-04T00:00:00.000Z'
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'branch-demo'
    });
    const rendered = renderCreativeReport(result);

    expect(result.activeBranches).toEqual([
      expect.objectContaining({
        id: '提前揭示身份',
        flavor: expect.stringContaining('提前'),
        compareCommand: 'storyspec branch:compare 提前揭示身份'
      })
    ]);
    expect(result.nextActions).toContain('比较 what-if：storyspec branch:compare 提前揭示身份');
    expect(rendered).toContain('活跃 what-if 分支');
    expect(rendered).toContain('会长成');
    expect(rendered).toContain('storyspec branch:compare 提前揭示身份');
  });

  it('summarizes what the author has already created as a creative echo', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-echo');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '编程施法');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 编程施法');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '编程施法',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界；编程施法、轻松冒险、慢热感情、文明级威胁。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'core.protagonist',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响主角视角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'magic.rule-hardness',
          stage: 'specify',
          topic: 'magic-system',
          question: '编程施法更偏硬规则，还是轻量隐喻？',
          whyItMatters: '影响能力边界。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'stage.first',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界压力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'partner.core',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系张力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'threat.first-symptom',
          stage: 'specify',
          topic: 'threat',
          question: '文明级威胁最早以什么小异常出现？',
          whyItMatters: '影响长线揭示。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.protagonist',
          answer: '晏无是工科马列青年，穿越后会用工程思维拆解法术事故。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'magic.rule-hardness',
          answer: '编程施法偏轻量隐喻，爽点来自调试事故而不是硬规则推演。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'stage.first',
          answer: '第一舞台是学院维修库，民生法器故障暴露知识垄断。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'threat.first-symptom',
          answer: '第三次寂静先表现为旧日志梦游和民生法器失灵。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });
    const rendered = renderCreativeReport(result);

    expect(result.creationEcho).toMatchObject({
      flavor: expect.stringContaining('编程施法'),
      strongestParts: expect.arrayContaining([
        expect.stringContaining('能力风味'),
        expect.stringContaining('世界问题'),
        expect.stringContaining('长线威胁')
      ]),
      missingPieces: expect.arrayContaining([
        expect.stringContaining('核心伙伴')
      ]),
      nextEcho: expect.stringContaining('这次创作已经让')
    });
    expect(rendered).toContain('创作回声');
    expect(rendered).toContain('当前风味');
    expect(rendered).toContain('已长出的关键部件');
    expect(rendered).toContain('还差的关键部件');
    expect(rendered).toContain('下一轮回声');
  });

  it('shows deferred choices as a decision log and brings them back as creation work', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-deferred');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '编程施法');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 编程施法');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '编程施法',
      premise: '异界穿越、编程施法、慢热感情',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'partner.core',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系张力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'core.protagonist',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响视角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'partner.core',
          answer: '稍后决定',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'core.protagonist',
          answer: '晏无是工科马列青年。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });
    const rendered = renderCreativeReport(result);

    expect(result.decisionLog.deferredItems).toEqual([
      expect.objectContaining({
        questionId: 'partner.core',
        answer: '稍后决定',
        trigger: expect.stringContaining('进入 plan'),
        resumeCommand: 'storyspec interview 编程施法 --focus partner'
      })
    ]);
    expect(result.nextActions[0]).toBe('storyspec interview 编程施法 --focus partner');
    expect(rendered).toContain('未决项回流与决策日志');
    expect(rendered).toContain('partner.core：核心伙伴是谁？');
    expect(rendered).toContain('当初选择：稍后决定');
    expect(rendered).toContain('回流条件：进入 plan');
  });
});
