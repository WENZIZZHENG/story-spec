import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseExampleBranchSet,
  renderExampleBranchMarkdown
} from '../../src/domain/example-branch.js';

const fixturePath = (name: string): string =>
  path.join(process.cwd(), 'templates', 'clarification', 'examples', name);

describe('example branch domain', () => {
  it('parses built-in example branch sets', async () => {
    const result = parseExampleBranchSet(
      await readFile(fixturePath('magic-system.yaml'), 'utf-8'),
      'magic-system.yaml'
    );

    expect(result.issues).toEqual([]);
    expect(result.branches).toHaveLength(4);
    expect(result.branches[0]).toEqual(expect.objectContaining({
      label: '作者主导：继续提问',
      sampleAnswer: expect.stringContaining('继续问我 3 个关键问题')
    }));
  });

  it('reports missing author-control branches', () => {
    const result = parseExampleBranchSet(`branches:
  - label: 轻松冒险版
    tone: 轻松
    assumptions:
      - 先开局冒险
    sampleAnswer: 先轻松开始
    tradeoffs:
      - 开局更快
  - label: 硬规则版
    tone: 清晰
    assumptions:
      - 先讲规则
    sampleAnswer: 先定规则
    tradeoffs:
      - 更有逻辑
  - label: 事故驱动版
    tone: 喜剧
    assumptions:
      - 错误推动剧情
    sampleAnswer: 让错误推动冒险
    tradeoffs:
      - 更热闹
`, 'missing-author.yaml');

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_AUTHOR_CONTROL_BRANCH' })
    ]));
  });

  it('renders markdown for example branches', () => {
    const markdown = renderExampleBranchMarkdown({
      label: '作者主导：继续提问',
      tone: '保留创作空间',
      assumptions: ['先不决定主角身份。'],
      sampleAnswer: '我先不定主角，请继续问我 3 个关键问题。',
      tradeoffs: ['推进较慢，但不会让 AI 替作者定稿。']
    });

    expect(markdown).toContain('### ExampleBranch：作者主导：继续提问');
    expect(markdown).toContain('confirmed: false');
    expect(markdown).toContain('取舍');
  });
});
