const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'build', 'generate-commands.sh');
const args = process.argv.slice(2);

const candidates = process.platform === 'win32'
  ? [
      'bash',
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe'
    ]
  : ['bash'];

let lastError = null;

for (const bash of candidates) {
  if (path.isAbsolute(bash) && !fs.existsSync(bash)) {
    continue;
  }

  const result = spawnSync(bash, [scriptPath, ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: false
  });

  if (!result.error) {
    process.exit(result.status ?? 0);
  }

  lastError = result.error;
}

console.error('无法找到 bash。请安装 Git Bash，或将 bash 加入 PATH。');
if (lastError) {
  console.error(lastError.message);
}
process.exit(1);
