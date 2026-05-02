const fs = require('fs');
const path = require('path');

const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
const runtimePath = path.join(__dirname, '..', 'dist', 'script-runtime.js');

if (process.platform !== 'win32' && fs.existsSync(cliPath)) {
  fs.chmodSync(cliPath, 0o755);
}

if (process.platform !== 'win32' && fs.existsSync(runtimePath)) {
  fs.chmodSync(runtimePath, 0o755);
}
