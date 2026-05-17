const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const distDir = path.join(webDir, 'dist');
const sourceHtmlPath = path.join(webDir, 'index.html');
const distHtmlPath = path.join(distDir, 'index.html');

fs.rmSync(distDir, { force: true, recursive: true });
fs.mkdirSync(distDir, { recursive: true });

const tscBin = path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [tscBin, '-p', path.join(webDir, 'tsconfig.json')], {
  cwd: rootDir,
  stdio: 'inherit'
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const html = fs.readFileSync(sourceHtmlPath, 'utf8')
  .replace('src="./src/main.ts"', 'src="./src/main.js"');

fs.writeFileSync(distHtmlPath, html);
console.log(`Built apps/web -> ${path.relative(rootDir, distDir)}`);
