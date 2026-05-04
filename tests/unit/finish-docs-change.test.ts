import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createDocsFinishPreview,
  renderDocsFinishSummary
} from '../../src/application/finish-docs-change.js';

describe('createDocsFinishPreview', () => {
  it('creates a dry-run checklist for documentation-only changes', () => {
    const projectRoot = path.resolve('demo-project');

    const result = createDocsFinishPreview({
      projectRoot,
      message: '记录章节生产流程命令变更'
    });

    expect(result).toMatchObject({
      projectRoot,
      mode: 'preview',
      writesFiles: false,
      placeholderPatterns: ['TBD', 'TODO', '待定']
    });
    expect(result.checks.map(check => check.command)).toEqual([
      'git diff --check',
      "Select-String -Path docs\\**\\*.md,changes\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive",
      'git status --short --branch'
    ]);
    expect(result.commitCommand).toBe('git commit -m "记录章节生产流程命令变更"');
    expect(renderDocsFinishSummary(result)).toContain('预览模式');
  });
});
