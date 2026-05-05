import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addPreset,
  inspectPreset,
  listPresets,
  renderPresetDoctor,
  renderPresetList
} from '../../src/application/manage-presets.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createPresetFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-preset-project');
  const packageRoot = path.join(os.tmpdir(), 'memory-novel-preset-package');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
    name: 'preset-demo'
  });
  await fileSystem.writeFile(path.join(packageRoot, 'presets', 'xuanhuan-cultivation', 'preset.yaml'), `id: xuanhuan-cultivation
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
reviewerWeights:
  worldbuilding: 1.4
validateRules: []
`);
  await fileSystem.writeFile(path.join(packageRoot, 'presets', 'xuanhuan-cultivation', 'commands', 'plan.md'), '# plan');
  await fileSystem.writeFile(path.join(packageRoot, 'presets', 'xuanhuan-cultivation', 'spec', 'world', 'cultivation.yaml'), `worldFacts:
  - id: world.cultivation.realm-system
    title: 境界体系
    summary: rule
    storyFunction: creates conflict
    constraints:
      - cost
`);

  return { projectRoot, packageRoot, fileSystem };
};

describe('manage presets', () => {
  it('lists and installs presets without overwriting user project content', async () => {
    const fixture = await createPresetFixture();
    const userWorldPath = path.join(fixture.projectRoot, 'spec', 'world', 'cultivation.yaml');
    await fixture.fileSystem.writeFile(userWorldPath, `worldFacts:
  - id: world.cultivation.realm-system
    title: 用户自定义境界体系
    summary: user owned
    storyFunction: creates conflict
    constraints:
      - user cost
`);

    const list = await listPresets(fixture);
    expect(list.presets.map(preset => preset.id)).toEqual(['xuanhuan-cultivation']);
    expect(renderPresetList(list)).toContain('Genre Preset 类型包');
    expect(renderPresetList(list)).toContain('xuanhuan-cultivation：玄幻修炼（类型包 / xuanhuan）');

    const result = await addPreset({
      ...fixture,
      presetId: 'xuanhuan-cultivation'
    });

    expect(result.targetDir).toBe(path.join(fixture.projectRoot, '.specify', 'presets', 'xuanhuan-cultivation'));
    await expect(fixture.fileSystem.pathExists(path.join(result.targetDir, 'preset.yaml'))).resolves.toBe(true);
    await expect(fixture.fileSystem.pathExists(path.join(fixture.projectRoot, 'spec', 'presets', 'current-preset.json'))).resolves.toBe(true);
    await expect(fixture.fileSystem.readFile(userWorldPath)).resolves.toContain('用户自定义境界体系');

    const doctor = await inspectPreset({
      projectRoot: fixture.projectRoot,
      fileSystem: fixture.fileSystem
    });
    expect(doctor.activePreset?.id).toBe('xuanhuan-cultivation');
    expect(doctor.issues).toEqual([]);
    expect(renderPresetDoctor(doctor)).toContain('当前类型包：xuanhuan-cultivation 玄幻修炼（xuanhuan）');
  });

  it('reports missing required WorldFact for active presets', async () => {
    const fixture = await createPresetFixture();
    await fixture.fileSystem.writeJson(path.join(fixture.projectRoot, 'spec', 'presets', 'current-preset.json'), {
      id: 'xuanhuan-cultivation',
      manifestPath: '.specify/presets/xuanhuan-cultivation/preset.yaml'
    });
    await fixture.fileSystem.copy(
      path.join(fixture.packageRoot, 'presets', 'xuanhuan-cultivation'),
      path.join(fixture.projectRoot, '.specify', 'presets', 'xuanhuan-cultivation')
    );
    await fixture.fileSystem.writeFile(path.join(fixture.projectRoot, 'spec', 'world', 'rules.yaml'), 'worldFacts: []');

    const doctor = await inspectPreset({
      projectRoot: fixture.projectRoot,
      fileSystem: fixture.fileSystem
    });

    expect(doctor.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_PRESET_WORLD_FACT',
        severity: 'warning'
      })
    ]));
  });
});
