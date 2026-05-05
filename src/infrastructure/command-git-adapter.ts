import { execSync } from 'node:child_process';
import type { GitAdapter } from '../application/project-ports.js';

export const commandGitAdapter: GitAdapter = {
  init: async projectPath => {
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
  },
  addAll: async projectPath => {
    execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
  },
  commit: async (projectPath, message) => {
    execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: projectPath, stdio: 'ignore' });
  },
  statusShort: async projectPath => {
    const output = execSync('git status --short --untracked-files=all', {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }
};
