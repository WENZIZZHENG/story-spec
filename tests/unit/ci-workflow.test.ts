import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

const readWorkflow = async (): Promise<string> =>
  readFile(path.join(repoRoot, '.github', 'workflows', 'ci.yml'), 'utf8');

const readBunVersion = async (): Promise<string> =>
  readFile(path.join(repoRoot, '.bun-version'), 'utf8');

describe('CI workflow dependency installation', () => {
  it('uses Bun frozen lockfile installation before verification', async () => {
    const workflow = await readWorkflow();
    const bunVersion = (await readBunVersion()).trim();

    expect(workflow).toContain('uses: oven-sh/setup-bun@v2');
    expect(workflow).toContain('bun-version-file: .bun-version');
    expect(workflow).toContain('run: bun install --frozen-lockfile');
    expect(workflow).toContain('run: npm run verify');
    expect(workflow).not.toContain('npm install --package-lock=false');
    expect(bunVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
