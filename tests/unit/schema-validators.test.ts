import { describe, expect, it } from 'vitest';
import { AI_PLATFORMS } from '../../src/utils/ai-platforms.js';
import {
  validateAIPlatformRegistry,
  validatePluginManifest,
  validateTrackingDocument,
  validateWritingTask
} from '../../src/validation/schema/index.js';

describe('schema validators', () => {
  it('validates the AI platform registry contract', () => {
    expect(validateAIPlatformRegistry(AI_PLATFORMS)).toEqual([]);
    expect(validateAIPlatformRegistry([
      {
        name: 'codex',
        dir: '.codex',
        commandsDir: 'prompts',
        displayName: 'Codex CLI',
        distDir: 'dist/codex',
        commandPrefix: '/storyspec-'
      },
      {
        name: 'codex',
        dir: '',
        commandsDir: '',
        displayName: '',
        distDir: '',
        commandPrefix: 'bad'
      }
    ])).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_AI_PLATFORM', severity: 'error' }),
      expect.objectContaining({ code: 'INVALID_AI_PLATFORM_FIELD', path: 'aiPlatforms[1].dir' }),
      expect.objectContaining({ code: 'INVALID_AI_COMMAND_PREFIX', path: 'aiPlatforms[1].commandPrefix' })
    ]));
  });

  it('validates tracking JSON documents', () => {
    expect(validateTrackingDocument({ currentState: {}, plotlines: {} }, 'plot-tracker.json')).toEqual([]);
    expect(validateTrackingDocument(null, 'plot-tracker.json')).toEqual([
      expect.objectContaining({
        code: 'INVALID_TRACKING_DOCUMENT',
        severity: 'error',
        path: 'plot-tracker.json'
      })
    ]);
  });

  it('validates slow-burn relationship tracking axes when present', () => {
    expect(validateTrackingDocument({
      relationshipArcs: [
        {
          id: 'rel.yanwu-rune-apprentice',
          participants: ['entity.yanwu', 'entity.rune-apprentice'],
          type: 'partner',
          currentState: {
            trust: 35,
            distance: '互相试探',
            conflict: '方法论冲突',
            vulnerability: '都不愿承认需要对方',
            repair: '共同承担事故后果'
          },
          turningPoints: [
            {
              chapter: 3,
              scene: 'scene-003',
              change: '第一次把后背交给对方',
              evidencePath: 'stories/demo/content/volume1/chapter-003.md'
            }
          ]
        }
      ]
    }, 'relationships.json')).toEqual([]);

    expect(validateTrackingDocument({
      relationshipArcs: [
        {
          id: 'rel.blank',
          participants: ['A'],
          currentState: {
            trust: 'high'
          },
          turningPoints: [
            {
              chapter: 1,
              change: '关系变化'
            }
          ]
        }
      ]
    }, 'relationships.json')).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'INVALID_TRACKING_DOCUMENT',
        path: 'relationships.json#relationshipArcs[0].participants'
      }),
      expect.objectContaining({
        code: 'INVALID_TRACKING_DOCUMENT',
        path: 'relationships.json#relationshipArcs[0].currentState.trust'
      }),
      expect.objectContaining({
        code: 'INVALID_TRACKING_DOCUMENT',
        path: 'relationships.json#relationshipArcs[0].turningPoints[0].evidencePath'
      })
    ]));
  });

  it('validates writing task metadata', () => {
    expect(validateWritingTask({
      id: 'T001',
      title: '第一章',
      status: 'todo',
      priority: 'P0',
      storyPath: 'stories/demo',
      tasksPath: 'stories/demo/tasks.md',
      writeReady: true,
      planOnly: false,
      dependencies: [],
      outputs: ['content/chapter-001.md'],
      requiredReads: ['stories/demo/specification.md'],
      allowedWrites: ['stories/demo/content/chapter-001.md'],
      clues: ['PL-01'],
      acceptanceCriteria: ['覆盖关键情节']
    })).toEqual([]);

    expect(validateWritingTask({
      id: 'task-1',
      title: '',
      status: 'waiting',
      priority: 'P9',
      outputs: []
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_TASK_ID' }),
      expect.objectContaining({ code: 'MISSING_TASK_TITLE' }),
      expect.objectContaining({ code: 'INVALID_TASK_STATUS' }),
      expect.objectContaining({ code: 'INVALID_TASK_PRIORITY' }),
      expect.objectContaining({ code: 'MISSING_TASK_OUTPUT' })
    ]));
  });

  it('validates plugin manifests', () => {
    expect(validatePluginManifest({
      name: 'genre-knowledge',
      version: '1.0.0',
      description: '类型知识',
      type: 'knowledge',
      commands: [{ id: 'genre-plan', file: 'commands/plan.md', description: '规划增强' }]
    })).toEqual([]);

    expect(validatePluginManifest({
      name: '',
      version: '',
      type: 'unknown',
      commands: [{ id: '', file: '', description: '' }]
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_PLUGIN_NAME' }),
      expect.objectContaining({ code: 'MISSING_PLUGIN_VERSION' }),
      expect.objectContaining({ code: 'INVALID_PLUGIN_TYPE' }),
      expect.objectContaining({ code: 'INVALID_PLUGIN_COMMAND', path: 'plugin.commands[0].id' })
    ]));
  });
});
