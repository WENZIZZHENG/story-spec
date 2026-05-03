import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getProjectAgentContractPath,
  loadAgentContract,
  renderAgentContract,
  renderAgentsProfileSection,
  writeAgentContract
} from '../../src/agent/contract.js';
import { syncAgentContract } from '../../src/application/sync-agent-contract.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('agent contract', () => {
  it('renders project name and selected profile sections', () => {
    const content = renderAgentContract({
      template: '# {{PROJECT_NAME}}\n\n{{AGENTS_PROFILE_SECTION}}\n',
      projectName: '星河',
      agentsProfile: 'romance,custom'
    });

    expect(content).toContain('# 星河');
    expect(content).toContain('画像 `romance`');
    expect(content).toContain('自定义画像 `custom`');
  });

  it('uses the default profile when none is selected', () => {
    expect(renderAgentsProfileSection()).toBe('- 默认画像：遵循项目宪章和任务元数据。');
  });

  it('loads the project contract before falling back to the package template', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);
    await fs.writeFile(path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'), 'template {{PROJECT_NAME}}');
    await fs.writeFile(getProjectAgentContractPath(projectRoot), 'project contract');

    await expect(loadAgentContract({
      packageRoot,
      projectRoot,
      fileSystem: fs
    })).resolves.toMatchObject({
      content: 'project contract',
      source: 'project'
    });
  });

  it('falls back to the package template when the project contract is missing', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);
    await fs.writeFile(path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'), 'template {{PROJECT_NAME}}');

    await expect(loadAgentContract({
      packageRoot,
      projectRoot,
      projectName: '默认项目',
      fileSystem: fs
    })).resolves.toMatchObject({
      content: 'template 默认项目',
      source: 'template'
    });
  });

  it('writes project contract and AGENTS.md from the same rendered template', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);
    await fs.writeFile(
      path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'),
      '# {{PROJECT_NAME}}\n\n{{AGENTS_PROFILE_SECTION}}\n'
    );

    const content = await writeAgentContract({
      packageRoot,
      projectRoot,
      projectName: '星河',
      agentsProfile: 'romance',
      fileSystem: fs
    });

    expect(content).toContain('# 星河');
    expect(content).toContain('画像 `romance`');
    await expect(fs.readFile(getProjectAgentContractPath(projectRoot))).resolves.toBe(content);
    await expect(fs.readFile(path.join(projectRoot, 'AGENTS.md'))).resolves.toBe(content);
  });

  it('syncs AGENTS.md from the project contract by default', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);
    const projectContractPath = getProjectAgentContractPath(projectRoot);

    await fs.writeFile(path.join(projectRoot, '.specify', 'config.json'), '{"name":"星河"}');
    await fs.writeFile(path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'), 'template {{PROJECT_NAME}}');
    await fs.writeFile(projectContractPath, 'project contract');
    await fs.writeFile(path.join(projectRoot, 'AGENTS.md'), 'old agents');

    const result = await syncAgentContract({
      packageRoot,
      projectRoot,
      fileSystem: fs
    });

    expect(result.source).toBe('project');
    expect(result.targets).toMatchObject([
      { relativePath: '.specify/agent-contract.md', action: 'source' },
      { relativePath: 'AGENTS.md', action: 'write' }
    ]);
    await expect(fs.readFile(path.join(projectRoot, 'AGENTS.md'))).resolves.toBe('project contract');
    await expect(fs.readFile(projectContractPath)).resolves.toBe('project contract');
  });

  it('can rebuild both contract files from the package template', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);

    await fs.writeFile(path.join(projectRoot, '.specify', 'config.json'), JSON.stringify({ name: '配置名' }));
    await fs.writeFile(
      path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'),
      '# {{PROJECT_NAME}}\n\n{{AGENTS_PROFILE_SECTION}}\n'
    );
    await fs.writeFile(getProjectAgentContractPath(projectRoot), 'old contract');

    const result = await syncAgentContract({
      packageRoot,
      projectRoot,
      fromTemplate: true,
      agentsProfile: 'romance',
      fileSystem: fs
    });

    expect(result.source).toBe('template');
    expect(result.targets).toMatchObject([
      { relativePath: '.specify/agent-contract.md', action: 'write' },
      { relativePath: 'AGENTS.md', action: 'write' }
    ]);
    await expect(fs.readFile(getProjectAgentContractPath(projectRoot))).resolves.toContain('# 配置名');
    await expect(fs.readFile(path.join(projectRoot, 'AGENTS.md'))).resolves.toContain('画像 `romance`');
  });

  it('reports planned writes without changing files in dry-run mode', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);

    await fs.writeFile(path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'), 'template {{PROJECT_NAME}}');
    await fs.writeFile(getProjectAgentContractPath(projectRoot), 'project contract');
    await fs.writeFile(path.join(projectRoot, 'AGENTS.md'), 'old agents');

    const result = await syncAgentContract({
      packageRoot,
      projectRoot,
      dryRun: true,
      fileSystem: fs
    });

    expect(result.dryRun).toBe(true);
    expect(result.targets).toMatchObject([
      { relativePath: '.specify/agent-contract.md', action: 'source' },
      { relativePath: 'AGENTS.md', action: 'write' }
    ]);
    await expect(fs.readFile(path.join(projectRoot, 'AGENTS.md'))).resolves.toBe('old agents');
  });
});
