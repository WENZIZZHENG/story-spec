import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePresetManifest } from '../../src/domain/preset-manifest.js';

const VALID_PRESET = `id: xuanhuan-cultivation
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
characterRoles:
  - id: role.protagonist
    name: 主角
    function: growth
pacingTemplates:
  - id: pacing.opening
    name: 开篇
    description: hook
commonMistakes:
  - id: mistake.free-power
    description: no cost
    suggestedAction: add cost
reviewerWeights:
  worldbuilding: 1.4
validateRules:
  - id: required-world-facts
    type: world-required
    description: check world facts
`;

describe('PresetManifest', () => {
  it('parses a genre preset manifest', () => {
    const result = parsePresetManifest(VALID_PRESET, 'preset.yaml');

    expect(result.issues).toEqual([]);
    expect(result.manifest).toMatchObject({
      id: 'xuanhuan-cultivation',
      name: '玄幻修炼',
      genre: 'xuanhuan',
      priority: 200
    });
    expect(result.manifest?.requiredWorldFacts[0]).toMatchObject({
      id: 'world.cultivation.realm-system',
      type: 'rule'
    });
    expect(result.manifest?.reviewerWeights.worldbuilding).toBe(1.4);
  });

  it('reports missing required fields', () => {
    const result = parsePresetManifest('id: bad\nrequiredWorldFacts:\n  - id: world.only\n', 'preset.yaml');

    expect(result.manifest).toBeUndefined();
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_PRESET_FIELD', path: 'preset.name' }),
      expect.objectContaining({ code: 'MISSING_PRESET_FIELD', path: 'preset.requiredWorldFacts[0].constraints' })
    ]));
  });

  it('parses the built-in mystery preset with clue fairness constraints', async () => {
    const manifestPath = path.join(process.cwd(), 'presets', 'mystery', 'preset.yaml');
    const result = parsePresetManifest(await readFile(manifestPath, 'utf-8'), manifestPath);

    expect(result.issues).toEqual([]);
    expect(result.manifest).toMatchObject({
      id: 'mystery',
      genre: 'mystery'
    });
    expect(result.manifest?.requiredWorldFacts.map(fact => fact.id)).toEqual(expect.arrayContaining([
      'world.mystery.clue-logic',
      'world.mystery.fair-play-boundary',
      'world.mystery.suspect-relationships'
    ]));
    expect(result.manifest?.reviewerWeights.continuity).toBeGreaterThan(1);
    expect(result.manifest?.reviewerWeights.reader).toBeGreaterThan(1);
  });
});
