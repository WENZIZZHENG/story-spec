import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  renderProjectValidation,
  validateProject
} from '../../src/application/validate-project.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createFileSystem = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-validate-project');
  const packageRoot = path.join(os.tmpdir(), 'memory-novel-validate-package');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.ensureDir(path.join(packageRoot, 'templates', 'commands'));
  await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'plan.md'), '# plan');
  await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'write.md'), '# write');

  await fileSystem.ensureDir(path.join(projectRoot, '.specify', 'templates', 'commands'));
  await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
    name: 'validate-demo',
    type: 'novel',
    version: '1.0.0'
  });
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
  await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'templates', 'commands', 'plan.md'), '# plan');

  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'world'));
  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'canon'));
  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'graph'));
  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'voice'));
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'plot-tracker.json'), '{"currentState":{}}');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'array.json'), '[]');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'broken.json'), '{bad');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), `worldFacts:
  - id: world.rule
    title: Rule
    type: rule
    summary: Summary
    storyFunction: Creates conflict
    constraints:
      - Must hold
`);
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), JSON.stringify({
    canonFacts: [{
      id: 'canon.fact',
      summary: 'Fact',
      evidence: [{ path: 'stories/demo/content/chapter-001.md' }]
    }]
  }));
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
    entities: [{
      id: 'entity.hero',
      type: 'character',
      name: 'Hero'
    }]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), {
    edges: [{
      id: 'edge.hero.self',
      from: 'entity.hero',
      to: 'entity.hero',
      relation: 'self',
      evidencePaths: ['stories/demo/content/chapter-001.md']
    }]
  });
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'character-voices.yaml'), `voiceFingerprints:
  - characterId: entity.hero
    sentenceLength: mixed
    forbiddenWords:
      - 随便吧
    addressRules:
      peer: 你
    emotionalExpression: short and direct
    conflictStyle: direct
    samplePaths:
      - spec/voice/samples/hero.md
`);
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'samples', 'hero.md'), '# Hero sample');

  const storyPath = path.join(projectRoot, 'stories', 'demo');
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P9] **T001** -    
  - **依赖**：T099
`);

  return { projectRoot, packageRoot, fileSystem };
};

describe('validateProject', () => {
  it('checks project structure, tracking JSON, task metadata, and missing templates', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(false);
    expect(result.summary).toMatchObject({
      stories: 1,
      tasks: 1,
      trackingFiles: 3,
      worldFiles: 1,
      canonFiles: 1,
      graphEntities: 1,
      graphEdges: 1,
      scenes: 0,
      voiceFingerprints: 1,
      templatesChecked: 2,
      agentCommandsChecked: 0
    });
    expect(result.issueCounts.error).toBeGreaterThanOrEqual(4);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_TRACKING_JSON', severity: 'error' }),
      expect.objectContaining({ code: 'INVALID_TRACKING_DOCUMENT', path: path.join(projectRoot, 'spec', 'tracking', 'array.json') }),
      expect.objectContaining({ code: 'MISSING_TASK_TITLE' }),
      expect.objectContaining({ code: 'INVALID_TASK_PRIORITY' }),
      expect.objectContaining({ code: 'MISSING_TASK_OUTPUT' }),
      expect.objectContaining({ code: 'UNKNOWN_TASK_DEPENDENCY', severity: 'error' }),
      expect.objectContaining({ code: 'MISSING_TEMPLATE', path: path.join(projectRoot, '.specify', 'templates', 'commands', 'write.md') })
    ]));
  });

  it('classifies missing outputs for unstarted tasks as task-output info', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-unstarted-output-scope');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-unstarted-output-scope-package');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'unstarted-output-scope',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'world'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'canon'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'graph'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'voice'));
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P0] **T001** - 起草第一章
  - **输出**：\`content/chapter-001.md\`
`);

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_TASK_OUTPUT',
        severity: 'info',
        scope: 'task-output',
        path: path.join(storyPath, 'content', 'chapter-001.md')
      })
    ]));
    expect(result.scopeCounts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        scope: 'task-output',
        blocking: 0,
        advisory: 0,
        info: 1
      })
    ]));
  });

  it('reports missing agent contract entry files', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-missing-contract');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-missing-contract-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates', 'commands'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'missing-contract',
      type: 'novel',
      version: '1.0.0'
    });

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_AGENT_CONTRACT',
        path: path.join(projectRoot, '.specify', 'agent-contract.md')
      }),
      expect.objectContaining({
        code: 'MISSING_AGENTS_FILE',
        path: path.join(projectRoot, 'AGENTS.md')
      })
    ]));
  });

  it('does not warn for missing spec, plan, or tasks in the idea stage', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-idea-stage');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-idea-stage-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'idea-stage',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'world'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'canon'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'graph'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'voice'));
    await fileSystem.writeFile(path.join(projectRoot, 'stories', 'idea-demo', 'idea.md'), '# 灵感');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.summary.storyStages.idea).toBe(1);
    expect(result.issues.map(issue => issue.code)).not.toContain('MISSING_SPECIFICATION');
    expect(result.issues.map(issue => issue.code)).not.toContain('MISSING_CREATIVE_PLAN');
    expect(result.issues.map(issue => issue.code)).not.toContain('MISSING_TASKS');
  });

  it('validates clarification records and flags unconfirmed suggestions used downstream', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-clarification-gate');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-clarification-gate-package');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'clarification-gate',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'world'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'canon'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'graph'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'voice'));
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越',
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
          id: 'threat.shape',
          stage: 'specify',
          topic: 'threat',
          question: '文明级威胁是什么？',
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
          answer: '稍后决定',
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
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '旧文明运行时重启');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_REQUIRED_CLARIFICATION_ANSWER',
        scope: 'import-clarification'
      }),
      expect.objectContaining({
        code: 'CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION'
      })
    ]));
    expect(result.scopeCounts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        scope: 'import-clarification',
        blocking: 0,
        advisory: 1,
        info: 0
      })
    ]));
  });

  it('warns when core story elements are not mature before a creative plan exists', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-core-elements-gate');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-core-elements-gate-package');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'core-elements-gate',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'world'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'canon'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'graph'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'voice'));
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界。',
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
          id: 'stage.first',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界规则的第一眼呈现。',
          type: 'textarea',
          required: false,
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
          questionId: 'stage.first',
          answer: '稍后决定',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'CORE_ELEMENT_NOT_READY_FOR_PLAN',
        severity: 'warning',
        message: expect.stringContaining('第一舞台')
      })
    ]));
  });

  it('reports missing world, canon, graph, and voice directories as warnings for old projects', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-missing-world-canon');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-missing-world-canon-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'old-project',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_WORLD_DIR', severity: 'warning' }),
      expect.objectContaining({ code: 'MISSING_CANON_DIR', severity: 'warning' }),
      expect.objectContaining({ code: 'MISSING_GRAPH_DIR', severity: 'warning' }),
      expect.objectContaining({ code: 'MISSING_VOICE_DIR', severity: 'warning' })
    ]));
  });

  it('reports invalid world and canon documents', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-invalid-world-canon');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-invalid-world-canon-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'invalid-world-canon',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), `worldFacts:
  - id: world.rule
`);
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), '{"canonFacts":[{"id":"canon.fact"}]}');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_WORLD_FACT_FIELD', severity: 'warning' }),
      expect.objectContaining({ code: 'MISSING_CANON_FACT_FIELD', severity: 'warning' })
    ]));
  });

  it('reports invalid graph and scene documents', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-invalid-graph-scene');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-invalid-graph-scene-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'invalid-graph-scene',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), 'worldFacts: []');
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), '{"canonFacts":[]}');
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
      entities: [{ id: 'entity.hero', type: 'character', name: 'Hero' }]
    });
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), {
      edges: [{
        id: 'edge.hero.unknown',
        from: 'entity.hero',
        to: 'entity.unknown',
        relation: 'knows',
        evidencePaths: ['stories/demo/content/chapter-001.md']
      }]
    });
    await fileSystem.writeFile(path.join(projectRoot, 'stories', 'demo', 'scenes', 'scene-001.yaml'), 'id: scene-001\nchapter: chapter-001\n');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNKNOWN_STORY_EDGE_ENTITY', severity: 'error' }),
      expect.objectContaining({ code: 'MISSING_SCENE_FIELD', severity: 'warning' })
    ]));
  });

  it('reports invalid voice documents', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-invalid-voice');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-invalid-voice-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'invalid-voice',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), 'worldFacts: []');
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'canon', 'facts.json'), '{"canonFacts":[]}');
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), { entities: [] });
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'character-voices.yaml'), `voiceFingerprints:
  - characterId: entity.hero
`);

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_VOICE_FIELD', severity: 'warning' })
    ]));
  });

  it('reports active preset world fact gaps', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'presets', 'xuanhuan-cultivation', 'preset.yaml'), `id: xuanhuan-cultivation
name: 玄幻修炼
version: "1.0.0"
description: preset
genre: xuanhuan
requiredWorldFacts:
  - id: world.cultivation.realm-system
    title: 境界体系
    storyFunction: creates conflict
    constraints:
      - cost
characterRoles: []
pacingTemplates: []
commonMistakes: []
reviewerWeights: {}
validateRules: []
`);
    await fileSystem.writeJson(path.join(projectRoot, 'spec', 'presets', 'current-preset.json'), {
      id: 'xuanhuan-cultivation',
      manifestPath: '.specify/presets/xuanhuan-cultivation/preset.yaml'
    });

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.summary.activePreset).toBe('xuanhuan-cultivation');
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_PRESET_WORLD_FACT',
        severity: 'warning'
      })
    ]));
  });

  it('checks generic command files when generic integration is declared', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-generic-commands');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-generic-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'plan.md'), '# plan');
    await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'write.md'), '# write');
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'generic-demo',
      type: 'novel',
      version: '1.0.0',
      integrations: [{ id: 'generic' }]
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'commands', 'plan.md'), '# plan');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.summary.agentCommandsChecked).toBe(2);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_AGENT_COMMAND',
        path: path.join(projectRoot, '.specify', 'commands', 'write.md')
      })
    ]));
  });

  it('warns when task-board.json is out of sync with tasks.md', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-stale-task-board');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-stale-task-board-package');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '001-demo');

    await fileSystem.ensureDir(path.join(packageRoot, 'templates'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'stale-task-board',
      type: 'novel',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'world'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'canon'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'graph'));
    await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'voice'));
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# 第一章');
    await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `- [x] [P0] [WRITE-READY] **T001** - 起草第一章
  - **输出**：\`content/chapter-001.md\`
`);
    await fileSystem.writeJson(path.join(storyPath, 'task-board.json'), {
      schemaVersion: '1.0',
      tasks: [{
        id: 'T001',
        status: 'todo'
      }]
    });

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'TASK_BOARD_OUT_OF_SYNC',
        severity: 'warning',
        path: path.join(storyPath, 'task-board.json'),
        message: expect.stringContaining('storyspec tasks:board 001-demo')
      })
    ]));
  });

  it('renders a concise validation report', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();
    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    const output = renderProjectValidation(result);

    expect(output).toContain('StorySpec 项目校验');
    expect(output).toContain(`根目录：${projectRoot}`);
    expect(output).toContain('结果：失败');
    expect(output).toContain('world 文件：1');
    expect(output).toContain('canon 文件：1');
    expect(output).toContain('graph entities：1');
    expect(output).toContain('graph edges：1');
    expect(output).toContain('scene cards：0');
    expect(output).toContain('voice fingerprints：1');
    expect(output).toContain('active preset：无');
    expect(output).toContain('generic commands：0');
    expect(output).toContain('分类摘要：');
    expect(output).toContain('project-structure');
    expect(output).toContain('blocking=');
    expect(output).toContain('advisory=');
    expect(output).toContain('info=');
    expect(output).toContain('MISSING_TEMPLATE');
    expect(output).toContain('INVALID_TRACKING_JSON');
  });

  it('can render only issues at or above a severity level', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();
    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    const output = renderProjectValidation(result, { minSeverity: 'error' });

    expect(output).toContain('[blocking/error]');
    expect(output).not.toContain('[advisory/warning]');
    expect(output).not.toContain('[info/info]');
  });
});
