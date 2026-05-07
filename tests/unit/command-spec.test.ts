import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCommandSpec } from '../../src/prompt/command-spec.js';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

const writeCommandSpec = `id: write
title: 章节写作
stage: drafting
description: 基于任务清单执行章节写作
arguments:
  hint: "[章节编号或任务ID]"
  required: false
requiredReads:
  - .specify/memory/constitution.md
  - stories/*/specification.md
  - stories/*/creative-plan.md
  - stories/*/tasks.md
  - spec/tracking/*.json
allowedWrites:
  - stories/*/content/**
  - spec/tracking/**
scripts:
  check:
    capability: check-writing-state
    sh: .specify/scripts/bash/check-writing-state.sh
    ps: .specify/scripts/powershell/check-writing-state.ps1
risk:
  requiresTaskBoundary: true
  highRiskContentPolicy: use-task-boundary
`;

describe('command spec parser', () => {
  it('parses a command YAML spec', () => {
    const result = parseCommandSpec(writeCommandSpec, 'templates/commands/write.command.yaml');

    expect(result.issues).toEqual([]);
    expect(result.spec).toMatchObject({
      id: 'write',
      title: '章节写作',
      stage: 'drafting',
      description: '基于任务清单执行章节写作',
      arguments: {
        hint: '[章节编号或任务ID]',
        required: false
      },
      requiredReads: [
        '.specify/memory/constitution.md',
        'stories/*/specification.md',
        'stories/*/creative-plan.md',
        'stories/*/tasks.md',
        'spec/tracking/*.json'
      ],
      allowedWrites: [
        'stories/*/content/**',
        'spec/tracking/**'
      ],
      scripts: {
        check: {
          capability: 'check-writing-state',
          sh: '.specify/scripts/bash/check-writing-state.sh',
          ps: '.specify/scripts/powershell/check-writing-state.ps1'
        }
      },
      risk: {
        requiresTaskBoundary: true,
        highRiskContentPolicy: 'use-task-boundary'
      },
      sourcePath: 'templates/commands/write.command.yaml'
    });
  });

  it('reports missing required fields without throwing', () => {
    const result = parseCommandSpec('id: analyze\nrequiredReads: []\nallowedWrites: []\n');

    expect(result.spec).toBeUndefined();
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'MISSING_COMMAND_FIELD', path: 'title' }),
      expect.objectContaining({ code: 'MISSING_COMMAND_FIELD', path: 'stage' }),
      expect.objectContaining({ code: 'MISSING_COMMAND_FIELD', path: 'description' })
    ]);
  });

  it('reports invalid field shapes', () => {
    const result = parseCommandSpec(`id: analyze
title: 作品分析
stage: analysis
description: 检查故事结构和连续性
requiredReads: .specify/memory/constitution.md
allowedWrites:
  - spec/reports/**
scripts:
  run:
    sh: .specify/scripts/bash/analyze-story.sh
risk:
  requiresTaskBoundary: yes
`);

    expect(result.spec).toBeUndefined();
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'INVALID_COMMAND_FIELD', path: 'requiredReads' }),
      expect.objectContaining({ code: 'MISSING_COMMAND_FIELD', path: 'scripts.run.capability' }),
      expect.objectContaining({ code: 'INVALID_COMMAND_FIELD', path: 'risk.requiresTaskBoundary' })
    ]);
  });

  it('reports invalid YAML as an issue', () => {
    const result = parseCommandSpec('id: [unterminated', 'bad.command.yaml');

    expect(result.spec).toBeUndefined();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: 'INVALID_COMMAND_SPEC',
      path: 'bad.command.yaml'
    });
  });

  it('parses migrated repository command specs', async () => {
    const commandsDir = path.join(repoRoot, 'templates', 'commands');
    const files = (await readdir(commandsDir))
      .filter(file => file.endsWith('.command.yaml'))
      .sort();

    expect(files).toEqual([
      'analyze.command.yaml',
      'reference-reverse.command.yaml',
      'write.command.yaml'
    ]);

    for (const file of files) {
      const content = await readFile(path.join(commandsDir, file), 'utf-8');
      const result = parseCommandSpec(content, `templates/commands/${file}`);

      expect(result.issues, file).toEqual([]);
      expect(result.spec?.id, file).toBe(file.replace('.command.yaml', ''));
      expect(result.spec?.requiredReads.length, file).toBeGreaterThan(0);
      expect(result.spec?.allowedWrites.length, file).toBeGreaterThan(0);
    }
  });
});
