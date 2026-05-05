import { execFile, type ExecFileException } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VerificationCommandResult, VerificationRunner } from '../application/project-ports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '..', 'cli.js');

interface ExecFileError extends ExecFileException {
  stdout?: string;
  stderr?: string;
}

const splitStorySpecCommand = (command: string): string[] => {
  const trimmed = command.trim();
  if (!trimmed.startsWith('storyspec ')) {
    throw new Error(`只支持 storyspec 验证命令：${command}`);
  }

  return trimmed.slice('storyspec '.length).split(/\s+/).filter(Boolean);
};

const exitCodeFromError = (error: ExecFileError): number => {
  if (typeof error.code === 'number') {
    return error.code;
  }

  return 1;
};

export const commandVerificationRunner: VerificationRunner = {
  run: async (projectPath, command): Promise<VerificationCommandResult> => {
    const args = splitStorySpecCommand(command);

    return await new Promise(resolve => {
      execFile('node', [cliPath, ...args], {
        cwd: projectPath,
        encoding: 'utf-8',
        windowsHide: true
      }, (error: ExecFileError | null, stdout, stderr) => {
        if (!error) {
          resolve({
            exitCode: 0,
            stdout,
            stderr
          });
          return;
        }

        resolve({
          exitCode: exitCodeFromError(error),
          stdout: stdout || error.stdout || '',
          stderr: stderr || error.stderr || ''
        });
      });
    });
  }
};
