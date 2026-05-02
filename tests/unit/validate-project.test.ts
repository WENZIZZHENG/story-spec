import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  renderProjectValidation,
  validateProject
} from '../../src/application/validate-project.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createFileSystem = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-validate-project');
  const packageRoot = path.join(os.tmpdir(), 'memory-novel-validate-package');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.ensureDir(path.join(packageRoot, 'templates', 'commands'));
  await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'plan.md'), '# plan');
  await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'write.md'), '# write');

  await fileSystem.ensureDir(path.join(projectRoot, '.specify', 'templates', 'commands'));
  await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
    name: 'validate-demo',
    type: 'novel',
    version: '1.0.0'
  });
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
  await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'templates', 'commands', 'plan.md'), '# plan');

  await fileSystem.ensureDir(path.join(projectRoot, 'spec', 'tracking'));
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'plot-tracker.json'), '{"currentState":{}}');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'array.json'), '[]');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'broken.json'), '{bad');

  const storyPath = path.join(projectRoot, 'stories', 'demo');
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P9] **T001** -    
  - **依赖**：T099
`);

  return { projectRoot, packageRoot, fileSystem };
};

describe('validateProject', () => {
  it('checks project structure, tracking JSON, task metadata, and missing templates', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(false);
    expect(result.summary).toMatchObject({
      stories: 1,
      tasks: 1,
      trackingFiles: 3,
      templatesChecked: 2,
      agentCommandsChecked: 0
    });
    expect(result.issueCounts.error).toBeGreaterThanOrEqual(4);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_TRACKING_JSON', severity: 'error' }),
      expect.objectContaining({ code: 'INVALID_TRACKING_DOCUMENT', path: path.join(projectRoot, 'spec', 'tracking', 'array.json') }),
      expect.objectContaining({ code: 'MISSING_TASK_TITLE' }),
      expect.objectContaining({ code: 'INVALID_TASK_PRIORITY' }),
      expect.objectContaining({ code: 'MISSING_TASK_OUTPUT' }),
      expect.objectContaining({ code: 'UNKNOWN_TASK_DEPENDENCY', severity: 'error' }),
      expect.objectContaining({ code: 'MISSING_TEMPLATE', path: path.join(projectRoot, '.specify', 'templates', 'commands', 'write.md') })
    ]));
  });

  it('reports missing agent contract entry files', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-missing-contract');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-missing-contract-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(packageRoot, 'templates', 'commands'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'missing-contract',
      type: 'novel',
      version: '1.0.0'
    });

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_AGENT_CONTRACT',
        path: path.join(projectRoot, '.specify', 'agent-contract.md')
      }),
      expect.objectContaining({
        code: 'MISSING_AGENTS_FILE',
        path: path.join(projectRoot, 'AGENTS.md')
      })
    ]));
  });

  it('checks generic command files when generic integration is declared', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-generic-commands');
    const packageRoot = path.join(os.tmpdir(), 'memory-novel-generic-package');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'plan.md'), '# plan');
    await fileSystem.writeFile(path.join(packageRoot, 'templates', 'commands', 'write.md'), '# write');
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'generic-demo',
      type: 'novel',
      version: '1.0.0',
      integrations: [{ id: 'generic' }]
    });
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'commands', 'plan.md'), '# plan');

    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    expect(result.summary.agentCommandsChecked).toBe(2);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MISSING_AGENT_COMMAND',
        path: path.join(projectRoot, '.specify', 'commands', 'write.md')
      })
    ]));
  });

  it('renders a concise validation report', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();
    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    const output = renderProjectValidation(result);

    expect(output).toContain('Novel Writer 项目校验');
    expect(output).toContain(`根目录：${projectRoot}`);
    expect(output).toContain('结果：失败');
    expect(output).toContain('generic commands：0');
    expect(output).toContain('MISSING_TEMPLATE');
    expect(output).toContain('INVALID_TRACKING_JSON');
  });

  it('can render only issues at or above a severity level', async () => {
    const { projectRoot, packageRoot, fileSystem } = await createFileSystem();
    const result = await validateProject({
      projectRoot,
      packageRoot,
      fileSystem
    });

    const output = renderProjectValidation(result, { minSeverity: 'error' });

    expect(output).toContain('[error]');
    expect(output).not.toContain('[warning]');
    expect(output).not.toContain('[info]');
  });
});
