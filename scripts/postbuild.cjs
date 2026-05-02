const fs = require('fs');
const path = require('path');

const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');

if (process.platform !== 'win32' && fs.existsSync(cliPath)) {
  fs.chmodSync(cliPath, 0o755);
}
