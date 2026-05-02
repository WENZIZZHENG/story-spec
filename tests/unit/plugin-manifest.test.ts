import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import {
  parsePluginManifest,
  PLUGIN_HOOK_POINTS,
  PLUGIN_KINDS,
  PLUGIN_TYPES
} from '../../src/domain/plugin-manifest.js';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

describe('PluginManifest', () => {
  it('normalizes declared plugin capabilities into typed arrays', () => {
    const result = parsePluginManifest({
      name: 'genre-knowledge',
      version: '1.2.3',
      displayName: '类型知识库',
      description: '类型知识库插件',
      type: 'knowledge',
      kind: 'preset',
      priority: 20,
      provides: ['knowledge', 'commands'],
      overrides: ['templates/commands/write'],
      commands: [
        { id: 'genre-plan', name: '类型规划', file: 'commands/plan.md', description: '增强规划' }
      ],
      templates: [
        'templates/story-template.md',
        { id: 'scene-template', file: 'templates/scene.md', target: 'spec/templates/scene.md' }
      ],
      knowledge: [
        { file: 'knowledge/genres/fantasy.md', description: '玄幻类型知识' }
      ],
      trackingRules: [
        { id: 'plot-rules', file: 'tracking/plot-rules.json' }
      ],
      experts: [
        { id: 'genre-editor', name: '类型编辑', title: '类型编辑', file: 'experts/editor.md', description: '类型创作顾问' }
      ],
      hooks: [
        {
          id: 'genre-plan-hook',
          point: 'pre-prompt-compile',
          source: 'commands/plan-enhance.md',
          target: 'templates/commands/plan.md',
          marker: 'genre-knowledge-plan'
        }
      ],
      dependencies: { core: '>=0.20.0' },
      installation: {
        message: '安装完成',
        files: [{ source: 'memory/style.md', target: '.specify/memory/style.md' }]
      },
      features: ['genre-knowledge']
    });

    expect(result.issues).toEqual([]);
    expect(result.manifest).toMatchObject({
      name: 'genre-knowledge',
      version: '1.2.3',
      displayName: '类型知识库',
      type: 'knowledge',
      kind: 'preset',
      priority: 20,
      provides: ['knowledge', 'commands'],
      overrides: ['templates/commands/write'],
      commands: [
        { id: 'genre-plan', name: '类型规划', file: 'commands/plan.md', description: '增强规划' }
      ],
      templates: [
        { id: 'story-template', file: 'templates/story-template.md' },
        { id: 'scene-template', file: 'templates/scene.md', target: 'spec/templates/scene.md' }
      ],
      knowledge: [
        { id: 'fantasy', file: 'knowledge/genres/fantasy.md', description: '玄幻类型知识' }
      ],
      trackingRules: [
        { id: 'plot-rules', file: 'tracking/plot-rules.json' }
      ],
      experts: [
        { id: 'genre-editor', name: '类型编辑', title: '类型编辑', file: 'experts/editor.md', description: '类型创作顾问' }
      ],
      hooks: [
        {
          id: 'genre-plan-hook',
          point: 'pre-prompt-compile',
          source: 'commands/plan-enhance.md',
          target: 'templates/commands/plan.md',
          marker: 'genre-knowledge-plan',
          strategy: 'append'
        }
      ],
      dependencies: { core: '>=0.20.0' },
      installation: {
        message: '安装完成',
        files: [{ source: 'memory/style.md', target: '.specify/memory/style.md' }]
      },
      features: ['genre-knowledge']
    });
  });

  it('parses every bundled plugin config as a compatible manifest', async () => {
    const pluginsDir = path.join(repoRoot, 'plugins');
    const pluginDirs = (await readdir(pluginsDir, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();

    expect(pluginDirs.length).toBeGreaterThan(0);

    for (const pluginDir of pluginDirs) {
      const configPath = path.join(pluginsDir, pluginDir, 'config.yaml');
      const raw = yaml.load(await readFile(configPath, 'utf-8'));
      const result = parsePluginManifest(raw);

      expect(result.issues, pluginDir).toEqual([]);
      expect(result.manifest).toEqual(expect.objectContaining({
        name: expect.any(String),
        version: expect.any(String),
        type: expect.stringMatching(new RegExp(`^(${PLUGIN_TYPES.join('|')})$`)),
        kind: expect.stringMatching(new RegExp(`^(${PLUGIN_KINDS.join('|')})$`)),
        priority: expect.any(Number),
        commands: expect.any(Array),
        templates: expect.any(Array),
        knowledge: expect.any(Array),
        trackingRules: expect.any(Array),
        experts: expect.any(Array),
        hooks: expect.any(Array),
        provides: expect.any(Array),
        overrides: expect.any(Array)
      }));
    }
  });

  it('derives new plugin kind defaults from legacy type fields', () => {
    const style = parsePluginManifest({
      name: 'style-plugin',
      version: '1.0.0',
      type: 'style'
    });
    const feature = parsePluginManifest({
      name: 'feature-plugin',
      version: '1.0.0',
      type: 'feature'
    });

    expect(style.issues).toEqual([]);
    expect(style.manifest).toMatchObject({
      kind: 'style-pack',
      priority: 0,
      provides: [],
      overrides: []
    });
    expect(feature.issues).toEqual([]);
    expect(feature.manifest).toMatchObject({
      kind: 'extension',
      priority: 0,
      provides: [],
      overrides: []
    });
  });

  it('reports invalid required fields and hook points without throwing', () => {
    const result = parsePluginManifest({
      name: '',
      version: '',
      type: 'unknown',
      kind: 'unknown',
      priority: 'high',
      provides: ['commands', ''],
      overrides: 'templates/commands/write',
      commands: [{ id: '', file: '', description: '' }],
      experts: [{ id: 'expert', file: '' }],
      hooks: [{ point: 'during-everything' }]
    });

    expect(result.manifest).toBeUndefined();
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'plugin.name' }),
      expect.objectContaining({ path: 'plugin.version' }),
      expect.objectContaining({ path: 'plugin.type' }),
      expect.objectContaining({ path: 'plugin.kind' }),
      expect.objectContaining({ path: 'plugin.priority' }),
      expect.objectContaining({ path: 'plugin.provides[1]' }),
      expect.objectContaining({ path: 'plugin.overrides' }),
      expect.objectContaining({ path: 'plugin.commands[0].id' }),
      expect.objectContaining({ path: 'plugin.experts[0].file' }),
      expect.objectContaining({ path: 'plugin.hooks[0].point' })
    ]));
    expect(PLUGIN_HOOK_POINTS).toContain('pre-prompt-compile');
  });
});
