import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  inspectVoice,
  inspectVoiceSample,
  renderVoiceInspection
} from '../../src/application/inspect-voice.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('inspectVoice', () => {
  it('inspects voice fingerprints and samples', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-voice-inspect');
    const fileSystem = new MemoryFileSystem(projectRoot);

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

    const result = await inspectVoice({ projectRoot, fileSystem });
    const sample = await inspectVoiceSample({ projectRoot, fileSystem, characterId: 'entity.hero' });

    expect(result.fingerprints).toHaveLength(1);
    expect(result.issues).toEqual([]);
    expect(renderVoiceInspection(result)).toContain('entity.hero');
    expect(sample.samples).toHaveLength(1);
    expect(sample.samples[0].content).toContain('Hero sample');
  });
});

