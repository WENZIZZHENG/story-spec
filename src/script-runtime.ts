#!/usr/bin/env node

import {
  access,
  chmod,
  cp,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import {
  checkWritingState,
  renderWritingStateChecklist
} from './application/check-writing-state.js';
import type { ProjectFileSystem } from './application/project-ports.js';

interface RuntimeOptions {
  projectRoot?: string;
  storyName?: string;
  checklist: boolean;
  json: boolean;
}

const usage = `Usage: node dist/script-runtime.js check-writing-state [options]

Options:
  --project-root <path>  Project root. Defaults to nearest .specify/config.json.
  --story <name>         Story directory name under stories/.
  --checklist            Print checklist output.
  --json                 Print JSON output.
  --help                 Show help.`;

const readValue = (args: string[], index: number, option: string): string => {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${option}`);
  }

  return value;
};

const parseOptions = (args: string[]): RuntimeOptions => {
  const options: RuntimeOptions = {
    checklist: false,
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help') {
      console.log(usage);
      process.exit(0);
    }

    if (arg === '--checklist') {
      options.checklist = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--project-root') {
      options.projectRoot = readValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--story') {
      options.storyName = readValue(args, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
};

const runtimeFileSystem: ProjectFileSystem = {
  pathExists: async (filePath) => {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  },
  ensureDir: async dirPath => {
    await mkdir(dirPath, { recursive: true });
  },
  copy: async (sourcePath, targetPath, options) => {
    await cp(sourcePath, targetPath, {
      recursive: true,
      force: options?.overwrite ?? true
    });
  },
  readDir: dirPath => readdir(dirPath),
  readFile: filePath => readFile(filePath, 'utf-8'),
  writeFile: async (filePath, content) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  },
  readJson: async filePath => JSON.parse(await readFile(filePath, 'utf-8')),
  writeJson: async (filePath, data, options) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, options?.spaces ?? 2));
  },
  stat: filePath => stat(filePath),
  chmod: (filePath, mode) => chmod(filePath, mode)
};

const findProjectRoot = async (startDir: string = process.cwd()): Promise<string | null> => {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    if (await runtimeFileSystem.pathExists(path.join(currentDir, '.specify', 'config.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
};

const resolveProjectRoot = async (options: RuntimeOptions): Promise<string> => {
  if (options.projectRoot) {
    return options.projectRoot;
  }

  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    throw new Error('Not in a novel-writer project. Pass --project-root.');
  }

  return projectRoot;
};

const runCheckWritingState = async (args: string[]): Promise<void> => {
  const options = parseOptions(args);
  const projectRoot = await resolveProjectRoot(options);
  const state = await checkWritingState({
    projectRoot,
    fileSystem: runtimeFileSystem,
    storyName: options.storyName
  });

  if (options.json) {
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  if (options.checklist) {
    console.log(renderWritingStateChecklist(state));
    return;
  }

  console.log(renderWritingStateChecklist(state));
};

const main = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '--help') {
    console.log(usage);
    return;
  }

  if (command === 'check-writing-state') {
    await runCheckWritingState(args);
    return;
  }

  throw new Error(`Unknown script runtime command: ${command}`);
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
