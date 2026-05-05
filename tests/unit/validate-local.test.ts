import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  renderLocalValidation,
  validateLocalProject
} from '../../src/application/validate-local.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('validateLocalProject', () => {
  it('passes when continuation entry and tracking JSON are present', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-local-validation');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeFile(path.join(projectRoot, 'CONTINUE.md'), '# continue');
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), { name: 'demo' });
    await fileSystem.ensureDir(path.join(projectRoot, 'stories'));
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'plot-tracker.json'), '{"ok":true}');

    const result = await validateLocalProject({ projectRoot, fileSystem });

    expect(result).toMatchObject({
      valid: true,
      checkedFiles: 4,
      checkedJson: 1,
      issues: []
    });
    expect(renderLocalValidation(result)).toContain('结果：通过');
  });

  it('fails on missing continuation entry and invalid tracking JSON', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-local-validation-fail');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), { name: 'demo' });
    await fileSystem.ensureDir(path.join(projectRoot, 'stories'));
    await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'broken.json'), '{bad');

    const result = await validateLocalProject({ projectRoot, fileSystem });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_LOCAL_FILE', path: path.join(projectRoot, 'CONTINUE.md') }),
      expect.objectContaining({ code: 'INVALID_LOCAL_JSON', path: path.join(projectRoot, 'spec', 'tracking', 'broken.json') })
    ]));
    expect(renderLocalValidation(result)).toContain('结果：失败');
  });
});
