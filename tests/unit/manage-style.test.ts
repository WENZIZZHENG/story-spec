import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  explainStyleRule,
  lintStyle
} from '../../src/application/manage-style.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-style');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeFile(path.join(projectRoot, 'stories', '001-demo', 'content', 'chapter-001.md'), [
    '# 第一章',
    '',
    '他心中涌起一种无法言说的感觉。',
    '你应该明白，我这么做都是为了你。'
  ].join('\n'));
  await fileSystem.writeFile(path.join(projectRoot, 'stories', '001-demo', 'content', 'chapter-002.md'), '干净段落。');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'style', 'banned-patterns.yaml'), [
    'rules:',
    '  - id: style.ai-empty-abstract',
    '    description: 避免空泛抽象表达。',
    '    pattern: 一种无法言说的感觉',
    '    severity: warning',
    '    suggestion: 改成具体动作或感官细节。',
    '  - id: style.disabled',
    '    description: 已关闭规则。',
    '    pattern: 你应该明白',
    '    severity: off',
    '    suggestion: 这条不会触发。'
  ].join('\n'));

  return { projectRoot, fileSystem };
};

describe('manage style', () => {
  it('lints markdown content with configurable rules and disabled rules', async () => {
    const fixture = await createProject();

    const result = await lintStyle({
      ...fixture,
      story: '001-demo',
      chapter: '001'
    });

    expect(result.scannedFiles.map(file => path.basename(file))).toEqual(['chapter-001.md']);
    expect(result.findings).toEqual([
      expect.objectContaining({
        ruleId: 'style.ai-empty-abstract',
        severity: 'warning',
        path: 'stories/001-demo/content/chapter-001.md:3',
        evidence: '他心中涌起一种无法言说的感觉。',
        suggestion: '改成具体动作或感官细节。'
      })
    ]);
    expect(result.summary.warning).toBe(1);
  });

  it('explains configured style rules', async () => {
    const fixture = await createProject();

    const explained = await explainStyleRule({
      ...fixture,
      ruleId: 'style.ai-empty-abstract'
    });

    expect(explained.rule).toMatchObject({
      id: 'style.ai-empty-abstract',
      severity: 'warning'
    });
  });
});
