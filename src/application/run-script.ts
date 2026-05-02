import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';

export type NovelScriptId =
  | 'analyze-story'
  | 'check-writing-state'
  | (string & {});

export type ScriptPlatform = 'bash' | 'powershell';
export type ScriptSource = 'project' | 'package';

export interface ScriptExecution {
  scriptId: NovelScriptId;
  command: string;
  args: string[];
  cwd: string;
  source: ScriptSource;
  scriptPath: string;
}

export interface ScriptExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type ScriptExecutor = (execution: ScriptExecution) => Promise<ScriptExecutionResult>;

export interface RunNovelScriptInput {
  projectRoot: string;
  packageRoot: string;
  fileSystem: ProjectFileSystem;
  executor: ScriptExecutor;
  scriptId: NovelScriptId;
  args?: string[];
  platform?: ScriptPlatform;
}

export class ScriptRunnerError extends Error {
  constructor(
    message: string,
    readonly code: 'SCRIPT_NOT_FOUND',
    readonly scriptId: NovelScriptId
  ) {
    super(message);
    this.name = 'ScriptRunnerError';
  }
}

const SCRIPT_EXTENSIONS: Record<ScriptPlatform, string> = {
  bash: '.sh',
  powershell: '.ps1'
};

const SCRIPT_DIRS: Record<ScriptPlatform, string> = {
  bash: 'bash',
  powershell: 'powershell'
};

const createExecutionCommand = (
  platform: ScriptPlatform,
  scriptPath: string,
  args: readonly string[]
): Pick<ScriptExecution, 'command' | 'args'> => {
  if (platform === 'powershell') {
    return {
      command: 'pwsh',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args]
    };
  }

  return {
    command: 'bash',
    args: [scriptPath, ...args]
  };
};

const candidateScriptPaths = (
  input: RunNovelScriptInput,
  platform: ScriptPlatform
): Array<{ source: ScriptSource; scriptPath: string }> => {
  const extension = SCRIPT_EXTENSIONS[platform];
  const platformDir = SCRIPT_DIRS[platform];
  const fileName = `${input.scriptId}${extension}`;

  return [
    {
      source: 'project',
      scriptPath: path.join(input.projectRoot, '.specify', 'scripts', platformDir, fileName)
    },
    {
      source: 'package',
      scriptPath: path.join(input.packageRoot, 'scripts', platformDir, fileName)
    }
  ];
};

const resolveScript = async (
  input: RunNovelScriptInput,
  platform: ScriptPlatform
): Promise<{ source: ScriptSource; scriptPath: string }> => {
  for (const candidate of candidateScriptPaths(input, platform)) {
    if (await input.fileSystem.pathExists(candidate.scriptPath)) {
      return candidate;
    }
  }

  throw new ScriptRunnerError(`Script not found: ${input.scriptId}`, 'SCRIPT_NOT_FOUND', input.scriptId);
};

export const runNovelScript = async (input: RunNovelScriptInput): Promise<ScriptExecutionResult> => {
  const platform = input.platform ?? (process.platform === 'win32' ? 'powershell' : 'bash');
  const { source, scriptPath } = await resolveScript(input, platform);
  const command = createExecutionCommand(platform, scriptPath, input.args ?? []);

  return input.executor({
    scriptId: input.scriptId,
    command: command.command,
    args: command.args,
    cwd: input.projectRoot,
    source,
    scriptPath
  });
};
