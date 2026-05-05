import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { VerificationCommandResult, VerificationRunner } from '../application/project-ports.js';

const PLACEHOLDER_SCAN_COMMAND = "Select-String -Path docs\\**\\*.md,changes\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive";
const PLACEHOLDER_PATTERN = /TBD|TODO|待定/g;

const runGitDiffCheck = async (projectPath: string): Promise<VerificationCommandResult> => await new Promise(resolve => {
  execFile('git', ['diff', '--check'], {
    cwd: projectPath,
    encoding: 'utf-8',
    windowsHide: true
  }, (error: any, stdout, stderr) => {
    resolve({
      exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
      stdout: stdout || '',
      stderr: stderr || ''
    });
  });
});

const collectMarkdownFiles = async (dirPath: string): Promise<string[]> => {
  const files: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
};

const runPlaceholderScan = async (projectPath: string): Promise<VerificationCommandResult> => {
  const docsFiles = await collectMarkdownFiles(path.join(projectPath, 'docs'));
  const changesFiles = await collectMarkdownFiles(path.join(projectPath, 'changes'));
  const findings: string[] = [];

  for (const filePath of [...docsFiles, ...changesFiles]) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      PLACEHOLDER_PATTERN.lastIndex = 0;
      const match = PLACEHOLDER_PATTERN.exec(line);
      if (match) {
        const relativePath = path.relative(projectPath, filePath).replace(/\\/g, '/');
        findings.push(`${relativePath}:${index + 1}: ${match[0]}`);
      }
    });
  }

  return {
    exitCode: findings.length > 0 ? 1 : 0,
    stdout: findings.join('\n'),
    stderr: ''
  };
};

export const commandDocsFinishVerificationRunner: VerificationRunner = {
  run: async (projectPath, command): Promise<VerificationCommandResult> => {
    if (command === 'git diff --check') {
      return await runGitDiffCheck(projectPath);
    }

    if (command === PLACEHOLDER_SCAN_COMMAND) {
      return await runPlaceholderScan(projectPath);
    }

    throw new Error(`不支持的文档收尾检查命令：${command}`);
  }
};
