import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDialogue,
  planDialogue
} from '../../src/application/manage-dialogue.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-dialogue');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), '# tasks');
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
    entities: [{ id: 'entity.protagonist', type: 'character', name: 'Hero' }]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'character-voices.yaml'), `voiceFingerprints:
  - characterId: entity.protagonist
    sentenceLength: mixed
    forbiddenWords:
      - 随便
    addressRules:
      peer: 你
    emotionalExpression: short
    conflictStyle: direct
    samplePaths:
      - spec/voice/samples/protagonist.md
`);
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'voice', 'samples', 'protagonist.md'), '# sample');

  return { projectRoot, fileSystem, storyPath };
};

describe('manage dialogue', () => {
  it('creates pending dialogue beats and validates voice/speaker references', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const planned = await planDialogue({
      projectRoot,
      fileSystem,
      story: '001-demo',
      chapter: '001',
      scene: 'scene-001'
    });

    expect(planned.outputPath).toContain(path.join('stories', '001-demo', 'dialogue', 'chapter-001.scene-001.yaml'));
    expect(planned.beats[0]).toMatchObject({
      sceneId: 'scene-001',
      speaker: 'entity.protagonist',
      voiceFingerprint: 'entity.protagonist'
    });

    const checked = await checkDialogue({
      projectRoot,
      fileSystem,
      story: '001-demo',
      chapter: '001'
    });

    expect(checked.beats).toHaveLength(1);
    expect(checked.issues).toEqual([]);
  });

  it('reports unknown speakers and missing relationship changes', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'dialogue', 'chapter-001.scene-001.yaml'), `dialogueBeats:
  - id: beat-001
    sceneId: scene-001
    speaker: entity.unknown
    line: 你是谁？
    intent: 试探
    emotion: 紧张
`);

    const checked = await checkDialogue({
      projectRoot,
      fileSystem,
      story: '001-demo'
    });

    expect(checked.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNKNOWN_DIALOGUE_SPEAKER', severity: 'error' }),
      expect.objectContaining({ code: 'MISSING_DIALOGUE_VOICE', severity: 'warning' }),
      expect.objectContaining({ code: 'MISSING_DIALOGUE_RELATIONSHIP_CHANGE', severity: 'info' })
    ]));
  });
});
