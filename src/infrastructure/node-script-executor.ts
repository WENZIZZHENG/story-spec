import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  ScriptExecution,
  ScriptExecutionResult,
  ScriptExecutor
} from '../application/run-script.js';

const execFileAsync = promisify(execFile);

export const nodeScriptExecutor: ScriptExecutor = async (
  execution: ScriptExecution
): Promise<ScriptExecutionResult> => {
  try {
    const result = await execFileAsync(execution.command, execution.args, {
      cwd: execution.cwd,
      windowsHide: true
    });

    return {
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error: any) {
    return {
      exitCode: typeof error.code === 'number' ? error.code : 1,
      stdout: typeof error.stdout === 'string' ? error.stdout : '',
      stderr: typeof error.stderr === 'string' ? error.stderr : error.message
    };
  }
};
