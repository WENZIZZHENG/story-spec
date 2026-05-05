import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

describe('check-world.sh location validation contract', () => {
  it('extracts defined locations and reports undefined explicit manuscript references', async () => {
    const script = await readFile(path.join(repoRoot, 'scripts', 'bash', 'check-world.sh'), 'utf-8');

    expect(script).toContain('extract_defined_locations');
    expect(script).toContain('find_explicit_location_references');
    expect(script).toContain('未定义地点引用');
    expect(script).toContain('@地点:');
  });
});
