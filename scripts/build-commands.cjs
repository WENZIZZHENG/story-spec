#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');
const tsxCli = require.resolve('tsx/cli');
const entry = path.join(root, 'scripts', 'build', 'build-commands.ts');
const result = spawnSync(process.execPath, [
  tsxCli,
  entry,
  ...process.argv.slice(2)
], {
  cwd: root,
  stdio: 'inherit',
  shell: false
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
