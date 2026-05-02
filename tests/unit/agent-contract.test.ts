import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getProjectAgentContractPath,
  loadAgentContract,
  renderAgentContract,
  renderAgentsProfileSection,
  writeAgentContract
} from '../../src/agent/contract.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('agent contract', () => {
  it('renders project name and selected profile sections', () => {
    const content = renderAgentContract({
      template: '# {{PROJECT_NAME}}\n\n{{AGENTS_PROFILE_SECTION}}\n',
      projectName: '星河',
      agentsProfile: 'romance,custom'
    });

    expect(content).toContain('# 星河');
    expect(content).toContain('Profile `romance`');
    expect(content).toContain('Custom profile `custom`');
  });

  it('uses the default profile when none is selected', () => {
    expect(renderAgentsProfileSection()).toBe('- Default profile: follow the project constitution and task metadata.');
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
    expect(content).toContain('Profile `romance`');
    await expect(fs.readFile(getProjectAgentContractPath(projectRoot))).resolves.toBe(content);
    await expect(fs.readFile(path.join(projectRoot, 'AGENTS.md'))).resolves.toBe(content);
  });
});
