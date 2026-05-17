const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const distDir = path.join(webDir, 'dist');
const requiredFiles = [
  path.join(distDir, 'index.html'),
  path.join(distDir, 'src', 'main.js')
];

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8']
]);

const parseOption = (name, fallback) => {
  const cliIndex = process.argv.indexOf(`--${name}`);
  if (cliIndex >= 0 && process.argv[cliIndex + 1]) {
    return process.argv[cliIndex + 1];
  }
  return process.env[`STORYSPEC_WEB_${name.toUpperCase()}`] ?? fallback;
};

const ensureBuild = () => {
  if (requiredFiles.every(file => fs.existsSync(file))) {
    return;
  }

  const result = spawnSync(process.execPath, [path.join(__dirname, 'build-web-app.cjs')], {
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
};

const resolveRequestPath = (urlPath) => {
  const decoded = decodeURIComponent(urlPath);
  const relativePath = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const targetPath = path.resolve(distDir, relativePath);
  const relativeToDist = path.relative(distDir, targetPath);

  if (relativeToDist.startsWith('..') || path.isAbsolute(relativeToDist)) {
    return undefined;
  }

  return targetPath;
};

ensureBuild();

const host = parseOption('host', '127.0.0.1');
const port = Number.parseInt(parseOption('port', '43217'), 10);

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${host}`);
  const targetPath = resolveRequestPath(requestUrl.pathname);

  if (!targetPath || !fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const contentType = mimeTypes.get(path.extname(targetPath)) ?? 'application/octet-stream';
  response.writeHead(200, { 'content-type': contentType });
  fs.createReadStream(targetPath).pipe(response);
});

server.listen(port, host, () => {
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  console.log(`StorySpec Web dev server: http://${host}:${actualPort}/`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
