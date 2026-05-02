import { describe, expect, it } from 'vitest';
import { parseVoiceDocument } from '../../src/domain/voice.js';

describe('voice domain', () => {
  it('parses valid voice fingerprints', () => {
    const result = parseVoiceDocument(`voiceFingerprints:
  - characterId: entity.hero
    sentenceLength: mixed
    diction:
      - direct
    forbiddenWords:
      - 随便吧
    addressRules:
      elder: 您
      peer: 你
    emotionalExpression: short and direct
    conflictStyle: direct
    samplePaths:
      - spec/voice/samples/hero.md
`, 'spec/voice/character-voices.yaml');

    expect(result.fingerprints).toHaveLength(1);
    expect(result.fingerprints[0]).toMatchObject({
      characterId: 'entity.hero',
      conflictStyle: 'direct',
      forbiddenWords: ['随便吧']
    });
    expect(result.issues).toEqual([]);
  });

  it('reports missing required voice fields', () => {
    const result = parseVoiceDocument(`voiceFingerprints:
  - characterId: entity.hero
`, 'spec/voice/character-voices.yaml');

    expect(result.fingerprints).toHaveLength(0);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_VOICE_FIELD', path: expect.stringContaining('.emotionalExpression') }),
      expect.objectContaining({ code: 'MISSING_VOICE_FIELD', path: expect.stringContaining('.samplePaths') })
    ]));
  });
});

