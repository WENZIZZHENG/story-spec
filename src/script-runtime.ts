#!/usr/bin/env node

import {
  checkWritingState,
  renderWritingStateChecklist
} from './application/check-writing-state.js';
import { nodeFileSystem } from './infrastructure/node-file-system.js';
import { findProjectRoot } from './utils/project.js';

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
    fileSystem: nodeFileSystem,
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
