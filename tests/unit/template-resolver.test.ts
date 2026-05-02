import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  resolveTemplateStack,
  resolveProjectTemplateStack,
  renderTemplateSourceDiagnostics,
  writeResolvedTemplates
} from '../../src/templates/resolver.js';

const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-template-resolver-'));
  tempDirs.push(dir);
  return dir;
};

const writeFixtureFile = async (rootDir: string, relativePath: string, content: string) => {
  const targetPath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('resolveTemplateStack', () => {
  it('resolves templates with project overrides before presets, extensions, and core', async () => {
    const workspace = await makeTempDir();
    const coreRoot = path.join(workspace, 'core');
    const extensionRoot = path.join(workspace, 'extensions', 'genre');
    const presetRoot = path.join(workspace, 'presets', 'three-act');
    const projectRoot = path.join(workspace, 'project');

    await writeFixtureFile(coreRoot, 'commands/plan.md', 'core plan');
    await writeFixtureFile(coreRoot, 'commands/specify.md', 'core specify');
    await writeFixtureFile(coreRoot, 'tracking/plot.json', 'core plot');

    await writeFixtureFile(extensionRoot, 'commands/plan.md', 'extension plan');
    await writeFixtureFile(extensionRoot, 'knowledge/genre.md', 'extension genre');

    await writeFixtureFile(presetRoot, 'commands/plan.md', 'preset plan');
    await writeFixtureFile(presetRoot, 'outline.md', 'preset outline');

    await writeFixtureFile(projectRoot, 'commands/plan.md', 'project plan');

    const result = await resolveTemplateStack({
      coreRoot,
      extensions: [{ name: 'genre', rootDir: extensionRoot }],
      presets: [{ name: 'three-act', rootDir: presetRoot }],
      projectRoot
    });

    expect(result.templates.map(template => [template.relativePath, template.source.kind, template.content])).toEqual([
      ['commands/plan.md', 'project', 'project plan'],
      ['commands/specify.md', 'core', 'core specify'],
      ['knowledge/genre.md', 'extension', 'extension genre'],
      ['outline.md', 'preset', 'preset outline'],
      ['tracking/plot.json', 'core', 'core plot']
    ]);

    expect(result.overrides.map(override => ({
      relativePath: override.relativePath,
      winner: override.winner.source.kind,
      shadowed: override.shadowed.map(template => template.source.kind)
    }))).toContainEqual({
      relativePath: 'commands/plan.md',
      winner: 'project',
      shadowed: ['preset', 'extension', 'core']
    });
    expect(result.diagnostics.map(diagnostic => ({
      relativePath: diagnostic.relativePath,
      finalSource: diagnostic.finalSource.kind,
      shadowedSources: diagnostic.shadowedSources.map(source => source.kind)
    }))).toContainEqual({
      relativePath: 'commands/plan.md',
      finalSource: 'project',
      shadowedSources: ['preset', 'extension', 'core']
    });
    expect(renderTemplateSourceDiagnostics(result.diagnostics)).toContain(
      'commands/plan.md: 最终 project，覆盖 preset/three-act, extension/genre, core'
    );
  });

  it('resolves the project template stack from conventional directories', async () => {
    const projectRoot = await makeTempDir();

    await writeFixtureFile(projectRoot, '.specify/templates/commands/plan.md', 'core plan');
    await writeFixtureFile(projectRoot, '.specify/templates/overrides/commands/plan.md', 'project plan');
    await writeFixtureFile(projectRoot, '.specify/extensions/genre/commands/plan.md', 'extension plan');
    await writeFixtureFile(projectRoot, '.specify/presets/three-act/commands/plan.md', 'preset plan');

    const result = await resolveProjectTemplateStack({ projectRoot });

    expect(result.templates.map(template => [template.relativePath, template.source.kind, template.content])).toEqual([
      ['commands/plan.md', 'project', 'project plan']
    ]);
    expect(result.diagnostics[0]).toMatchObject({
      relativePath: 'commands/plan.md',
      finalSource: {
        kind: 'project',
        name: 'project'
      }
    });
    expect(result.diagnostics[0].shadowedSources.map(source => `${source.kind}/${source.name}`)).toEqual([
      'preset/three-act',
      'extension/genre',
      'core/core'
    ]);
  });

  it('writes resolved templates to a target directory', async () => {
    const workspace = await makeTempDir();
    const coreRoot = path.join(workspace, 'core');
    const projectRoot = path.join(workspace, 'project');
    const outDir = path.join(workspace, 'out');

    await writeFixtureFile(coreRoot, 'commands/write.md', 'core write');
    await writeFixtureFile(projectRoot, 'commands/write.md', 'project write');
    await writeFixtureFile(projectRoot, 'knowledge/world.md', 'project world');

    const result = await resolveTemplateStack({
      coreRoot,
      projectRoot
    });
    await writeResolvedTemplates(result.templates, outDir);

    await expect(readFile(path.join(outDir, 'commands', 'write.md'), 'utf-8')).resolves.toBe('project write');
    await expect(readFile(path.join(outDir, 'knowledge', 'world.md'), 'utf-8')).resolves.toBe('project world');
  });
});
