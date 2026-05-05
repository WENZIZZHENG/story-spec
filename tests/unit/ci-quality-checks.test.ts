import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getCiQualityChecks,
  renderCiQualityCheckReport
} from '../../src/application/ci-quality-checks.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createCiFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-ci-project');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeFile(path.join(projectRoot, 'changes', 'example.md'), '# change');
  await fileSystem.writeFile(path.join(projectRoot, 'scripts', 'build', 'check-change-records.ts'), 'check');
  await fileSystem.writeFile(path.join(projectRoot, 'scripts', 'build', 'command-artifact-manifest.ts'), 'manifest');
  await fileSystem.writeFile(path.join(projectRoot, 'tests', 'fixtures', 'command-artifacts.manifest.json'), '{}');
  await fileSystem.writeFile(path.join(projectRoot, 'templates', 'commands', 'write.md'), '# write');
  await fileSystem.writeFile(path.join(projectRoot, 'src', 'agent', 'acceptance.ts'), 'acceptance');
  await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'agent-integration-acceptance.md'), '# acceptance');
  await fileSystem.writeFile(path.join(projectRoot, 'tests', 'unit', 'agent-registry.test.ts'), 'test');
  await fileSystem.writeFile(path.join(projectRoot, 'tests', 'unit', 'platform-renderers.test.ts'), 'test');
  await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'todo-archive.md'), '# archive');
  await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'todo-index.md'), '# index\n[Agent](agent-ci-quality-roadmap.md)');

  return { projectRoot, fileSystem };
};

describe('ci quality checks', () => {
  it('reports the local CI check manifest with stable fields', async () => {
    const fixture = await createCiFixture();

    const result = await getCiQualityChecks(fixture);

    expect(result.valid).toBe(true);
    expect(result.checks.map(check => check.checkId)).toEqual([
      'changes.records',
      'command.manifest',
      'agent.acceptance',
      'todo.boundary'
    ]);
    expect(result.checks.every(check => (
      check.status === 'pass'
      && typeof check.command === 'string'
      && check.files.length > 0
      && typeof check.message === 'string'
      && typeof check.suggestedAction === 'string'
    ))).toBe(true);
    expect(renderCiQualityCheckReport(result)).toContain('StorySpec CI 检查清单');
    expect(renderCiQualityCheckReport(result)).toContain('changes.records');
  });

  it('marks checks as failed when required files are missing', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-ci-missing');
    const fileSystem = new MemoryFileSystem(projectRoot);
    await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'todo-index.md'), '# index');

    const result = await getCiQualityChecks({ projectRoot, fileSystem });

    expect(result.valid).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        checkId: 'changes.records',
        status: 'fail',
        suggestedAction: expect.stringContaining('npm run check:changes')
      })
    ]));
  });
});
