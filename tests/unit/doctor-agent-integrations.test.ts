import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  doctorAgentIntegrations,
  renderAgentDoctorResult
} from '../../src/application/doctor-agent-integrations.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('doctorAgentIntegrations', () => {
  it('reports installed generic integration and missing command files', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);

    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'story',
      integrations: [{ id: 'generic' }]
    });
    await fs.writeFile(path.join(projectRoot, 'AGENTS.md'), '# agents');
    await fs.writeFile(path.join(projectRoot, '.specify', 'agent-contract.md'), '# contract');
    await fs.writeFile(path.join(projectRoot, '.specify', 'commands', 'write.md'), '# write');
    await fs.writeFile(path.join(packageRoot, 'dist', 'generic', '.specify', 'commands', 'write.md'), '# write');
    await fs.writeFile(path.join(packageRoot, 'dist', 'generic', '.specify', 'commands', 'plan.md'), '# plan');
    await fs.writeFile(path.join(projectRoot, '.specify', 'templates', 'commands', 'plan.md'), 'core plan');
    await fs.writeFile(path.join(projectRoot, '.specify', 'templates', 'overrides', 'commands', 'plan.md'), 'project plan');
    await fs.writeFile(path.join(projectRoot, '.specify', 'presets', 'three-act', 'commands', 'plan.md'), 'preset plan');
    await fs.writeFile(path.join(projectRoot, '.specify', 'extensions', 'genre', 'commands', 'plan.md'), 'extension plan');

    const result = await doctorAgentIntegrations({
      projectRoot,
      packageRoot,
      fileSystem: fs
    });

    expect(result.valid).toBe(false);
    expect(result.integrations.find(integration => integration.id === 'generic')).toMatchObject({
      installed: true,
      commandCount: 1
    });
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        agent: 'generic',
        code: 'MISSING_COMMAND_FILE',
        path: path.join(projectRoot, '.specify', 'commands', 'plan.md')
      })
    ]));
    expect(result.templateDiagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relativePath: 'commands/plan.md',
        finalSource: expect.objectContaining({ kind: 'project' }),
        shadowedSources: expect.arrayContaining([
          expect.objectContaining({ kind: 'preset', name: 'three-act' }),
          expect.objectContaining({ kind: 'extension', name: 'genre' }),
          expect.objectContaining({ kind: 'core' })
        ])
      })
    ]));
    const rendered = renderAgentDoctorResult(result);
    expect(rendered).toContain('Generic Markdown Agent');
    expect(rendered).toContain('Template source diagnostics');
    expect(rendered).toContain('commands/plan.md: 最终 project，覆盖 preset/three-act, extension/genre, core');
  });

  it('reports missing root contract files', async () => {
    const root = path.join('D:', 'workspace');
    const packageRoot = path.join(root, 'package');
    const projectRoot = path.join(root, 'story');
    const fs = new MemoryFileSystem(root);

    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'story'
    });

    const result = await doctorAgentIntegrations({
      projectRoot,
      packageRoot,
      fileSystem: fs
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_AGENT_CONTRACT' }),
      expect.objectContaining({ code: 'MISSING_AGENTS_FILE' })
    ]));
  });
});
