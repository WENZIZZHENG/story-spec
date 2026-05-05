import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  finishDocsChange,
  createDocsFinishPreview,
  renderDocsFinishSummary
} from '../../src/application/finish-docs-change.js';
import type { GitAdapter, VerificationRunner } from '../../src/application/project-ports.js';

const createFakeGitAdapter = (status: string[] = []) => {
  const calls: { addAll: string[]; commit: Array<{ projectPath: string; message: string }> } = {
    addAll: [],
    commit: []
  };
  const adapter: GitAdapter = {
    init: async () => undefined,
    addAll: async projectPath => {
      calls.addAll.push(projectPath);
    },
    commit: async (projectPath, message) => {
      calls.commit.push({ projectPath, message });
    },
    statusShort: async () => status
  };

  return { adapter, calls };
};

const createFakeVerificationRunner = (
  results: Record<string, { exitCode: number; stdout?: string; stderr?: string }> = {}
) => {
  const commands: string[] = [];
  const runner: VerificationRunner = {
    run: async (_projectRoot, command) => {
      commands.push(command);
      return results[command] ?? { exitCode: 0, stdout: '', stderr: '' };
    }
  };

  return { runner, commands };
};

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

  it('keeps preview mode side-effect free when commit is not requested', async () => {
    const projectRoot = path.resolve('demo-project');
    const { adapter, calls } = createFakeGitAdapter(['M docs/tech/todo-index.md']);
    const { runner, commands } = createFakeVerificationRunner();

    const result = await finishDocsChange({
      projectRoot,
      gitAdapter: adapter,
      verificationRunner: runner,
      message: '记录文档收尾'
    });

    expect(result).toMatchObject({
      projectRoot,
      mode: 'preview',
      writesFiles: false,
      blocked: false,
      commit: {
        requested: false,
        created: false,
        message: '记录文档收尾'
      }
    });
    expect(result.commitCommand).toBe('git commit -m "记录文档收尾"');
    expect(commands).toEqual([]);
    expect(calls.addAll).toEqual([]);
    expect(calls.commit).toEqual([]);
  });

  it('blocks commit when git diff check fails', async () => {
    const projectRoot = path.resolve('demo-project');
    const { adapter, calls } = createFakeGitAdapter(['M docs/tech/todo-index.md']);
    const { runner, commands } = createFakeVerificationRunner({
      'git diff --check': {
        exitCode: 1,
        stderr: 'docs/tech/todo-index.md:12: trailing whitespace.'
      }
    });

    const result = await finishDocsChange({
      projectRoot,
      gitAdapter: adapter,
      verificationRunner: runner,
      commit: true,
      message: '记录文档收尾'
    });

    expect(result).toMatchObject({
      mode: 'commit',
      blocked: true,
      blockedReasons: ['检查失败：git diff --check'],
      commit: {
        requested: true,
        created: false,
        message: '记录文档收尾',
        skippedReason: '文档收尾检查被阻断'
      }
    });
    expect(result.checks).toEqual([
      expect.objectContaining({
        id: 'git-diff-check',
        status: 'failed',
        command: 'git diff --check',
        exitCode: 1,
        message: 'docs/tech/todo-index.md:12: trailing whitespace.'
      })
    ]);
    expect(commands).toEqual(['git diff --check']);
    expect(calls.addAll).toEqual([]);
    expect(calls.commit).toEqual([]);
  });

  it('blocks commit when placeholder scan finds unresolved markers', async () => {
    const projectRoot = path.resolve('demo-project');
    const { adapter, calls } = createFakeGitAdapter(['M docs/tech/todo-index.md']);
    const { runner, commands } = createFakeVerificationRunner({
      "Select-String -Path docs\\**\\*.md,changes\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive": {
        exitCode: 1,
        stdout: 'docs/tech/todo-index.md:9: TODO'
      }
    });

    const result = await finishDocsChange({
      projectRoot,
      gitAdapter: adapter,
      verificationRunner: runner,
      commit: true,
      message: '记录文档收尾'
    });

    expect(result).toMatchObject({
      blocked: true,
      blockedReasons: ['检查失败：placeholder 扫描'],
      commit: {
        requested: true,
        created: false,
        skippedReason: '文档收尾检查被阻断'
      }
    });
    expect(result.checks).toEqual([
      expect.objectContaining({ id: 'git-diff-check', status: 'passed' }),
      expect.objectContaining({
        id: 'placeholder-scan',
        status: 'failed',
        message: 'docs/tech/todo-index.md:9: TODO'
      })
    ]);
    expect(commands).toEqual([
      'git diff --check',
      "Select-String -Path docs\\**\\*.md,changes\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive"
    ]);
    expect(calls.addAll).toEqual([]);
    expect(calls.commit).toEqual([]);
  });

  it('skips commit when git status contains non-documentation changes', async () => {
    const projectRoot = path.resolve('demo-project');
    const { adapter, calls } = createFakeGitAdapter([
      'M docs/tech/todo-index.md',
      'M src/application/finish-docs-change.ts'
    ]);
    const { runner } = createFakeVerificationRunner();

    const result = await finishDocsChange({
      projectRoot,
      gitAdapter: adapter,
      verificationRunner: runner,
      commit: true,
      message: '记录文档收尾'
    });

    expect(result).toMatchObject({
      blocked: false,
      changedFiles: [
        'docs/tech/todo-index.md',
        'src/application/finish-docs-change.ts'
      ],
      commit: {
        requested: true,
        created: false,
        message: '记录文档收尾',
        skippedReason: '存在非文档-only change：src/application/finish-docs-change.ts'
      }
    });
    expect(calls.addAll).toEqual([]);
    expect(calls.commit).toEqual([]);
  });

  it('commits documentation-only changes after checks pass', async () => {
    const projectRoot = path.resolve('demo-project');
    const { adapter, calls } = createFakeGitAdapter([
      'M docs/tech/todo-index.md',
      '?? changes/2026-05-05-docs-finish.md',
      'A openspec/changes/add-docs-finish-commit/proposal.md'
    ]);
    const { runner } = createFakeVerificationRunner();

    const result = await finishDocsChange({
      projectRoot,
      gitAdapter: adapter,
      verificationRunner: runner,
      commit: true,
      message: '记录文档收尾'
    });

    expect(result).toMatchObject({
      mode: 'commit',
      blocked: false,
      commit: {
        requested: true,
        created: true,
        message: '记录文档收尾'
      }
    });
    expect(result.changedFiles).toEqual([
      'docs/tech/todo-index.md',
      'changes/2026-05-05-docs-finish.md',
      'openspec/changes/add-docs-finish-commit/proposal.md'
    ]);
    expect(calls.addAll).toEqual([projectRoot]);
    expect(calls.commit).toEqual([
      {
        projectPath: projectRoot,
        message: '记录文档收尾'
      }
    ]);
  });
});
