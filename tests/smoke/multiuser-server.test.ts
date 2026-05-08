import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');

describe('multiuser server smoke', () => {
  it('shows the multiuser server command in CLI help', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath,
      '--help'
    ], { cwd: repoRoot });

    expect(stdout).toContain('server [options]');
  });
});
