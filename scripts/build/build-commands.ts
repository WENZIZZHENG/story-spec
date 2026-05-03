#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCommandArtifacts,
  BUILD_COMMAND_AGENTS,
  BUILD_COMMAND_SCRIPTS,
  type BuildCommandAgent
} from '../../src/prompt/build-commands.js';
import type { ScriptVariant } from '../../src/prompt/compiler.js';

interface BuildCommandsCliOptions {
  agents: BuildCommandAgent[];
  scripts: ScriptVariant[];
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirname, '..', '..');

const usage = `用法: node scripts/build-commands.cjs [选项]

选项:
  --agents=AGENT1,AGENT2   指定要构建的平台，默认全部
  --scripts=SCRIPT1,...    指定脚本类型，默认全部，可选 sh,ps
  --help                   显示帮助

示例:
  node scripts/build-commands.cjs
  node scripts/build-commands.cjs --agents=claude,codex --scripts=sh`;

const parseCsv = (value: string): string[] => value
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const parseOptions = (args: string[]): BuildCommandsCliOptions => {
  let agents: BuildCommandAgent[] = [...BUILD_COMMAND_AGENTS];
  let scripts: ScriptVariant[] = [...BUILD_COMMAND_SCRIPTS];

  for (const arg of args) {
    if (arg === '--help') {
      console.log(usage);
      process.exit(0);
    }

    if (arg.startsWith('--agents=')) {
      const values = parseCsv(arg.slice('--agents='.length));
      const invalid = values.filter(value => !BUILD_COMMAND_AGENTS.includes(value as BuildCommandAgent));
      if (invalid.length > 0) {
        throw new Error(`未知平台: ${invalid.join(', ')}`);
      }
      agents = values as BuildCommandAgent[];
      continue;
    }

    if (arg.startsWith('--scripts=')) {
      const values = parseCsv(arg.slice('--scripts='.length));
      const invalid = values.filter(value => !BUILD_COMMAND_SCRIPTS.includes(value as ScriptVariant));
      if (invalid.length > 0) {
        throw new Error(`未知脚本类型: ${invalid.join(', ')}`);
      }
      scripts = values as ScriptVariant[];
      continue;
    }

    throw new Error(`未知参数: ${arg}`);
  }

  return {
    agents,
    scripts
  };
};

try {
  const options = parseOptions(process.argv.slice(2));

  console.log('StorySpec 命令构建系统');
  console.log('================================');
  console.log('构建配置:');
  console.log(`  平台: ${options.agents.join(' ')}`);
  console.log(`  脚本: ${options.scripts.join(' ')}`);

  const result = await buildCommandArtifacts({
    rootDir,
    agents: options.agents,
    scripts: options.scripts
  });

  for (const variant of result.variants) {
    console.log(`  ${variant.agent} (${variant.script}) 完成: ${variant.commandCount} 个命令`);
  }

  console.log('================================');
  console.log('构建完成');
  console.log(`构建产物位于: ${result.outDir}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('使用 --help 查看帮助');
  process.exit(1);
}
