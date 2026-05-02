import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runNovelScript,
  ScriptRunnerError,
  type ScriptExecution
} from '../../src/application/run-script.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createRunnerFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-script-project');
  const packageRoot = path.join(os.tmpdir(), 'memory-novel-script-package');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const executions: ScriptExecution[] = [];

  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'scripts', 'bash', 'analyze-story.sh'), '# local analyze');
  await fileSystem.writeFile(path.join(packageRoot, 'scripts', 'bash', 'check-writing-state.sh'), '# package check');
  await fileSystem.writeFile(path.join(packageRoot, 'scripts', 'powershell', 'check-writing-state.ps1'), '# package check ps');

  return {
    projectRoot,
    packageRoot,
    fileSystem,
    executions,
    executor: async (execution: ScriptExecution) => {
      executions.push(execution);
      return {
        exitCode: 0,
        stdout: `ran ${execution.scriptId}`,
        stderr: ''
      };
    }
  };
};

describe('runNovelScript', () => {
  it('runs a project-local bash script before package fallback', async () => {
    const fixture = await createRunnerFixture();

    const result = await runNovelScript({
      projectRoot: fixture.projectRoot,
      packageRoot: fixture.packageRoot,
      fileSystem: fixture.fileSystem,
      executor: fixture.executor,
      scriptId: 'analyze-story',
      args: ['demo', 'quality'],
      platform: 'bash'
    });

    expect(result.stdout).toBe('ran analyze-story');
    expect(fixture.executions).toEqual([
      expect.objectContaining({
        scriptId: 'analyze-story',
        command: 'bash',
        args: [path.join(fixture.projectRoot, '.specify', 'scripts', 'bash', 'analyze-story.sh'), 'demo', 'quality'],
        cwd: fixture.projectRoot,
        source: 'project'
      })
    ]);
  });

  it('falls back to package scripts and can choose PowerShell', async () => {
    const fixture = await createRunnerFixture();

    await runNovelScript({
      projectRoot: fixture.projectRoot,
      packageRoot: fixture.packageRoot,
      fileSystem: fixture.fileSystem,
      executor: fixture.executor,
      scriptId: 'check-writing-state',
      args: ['--checklist'],
      platform: 'powershell'
    });

    expect(fixture.executions[0]).toMatchObject({
      scriptId: 'check-writing-state',
      command: 'pwsh',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(fixture.packageRoot, 'scripts', 'powershell', 'check-writing-state.ps1'), '--checklist'],
      cwd: fixture.projectRoot,
      source: 'package'
    });
  });

  it('throws a structured error when a script is unavailable', async () => {
    const fixture = await createRunnerFixture();

    await expect(runNovelScript({
      projectRoot: fixture.projectRoot,
      packageRoot: fixture.packageRoot,
      fileSystem: fixture.fileSystem,
      executor: fixture.executor,
      scriptId: 'missing-script',
      platform: 'bash'
    })).rejects.toMatchObject({
      name: 'ScriptRunnerError',
      code: 'SCRIPT_NOT_FOUND'
    } satisfies Partial<ScriptRunnerError>);
  });
});
