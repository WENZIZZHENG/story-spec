import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const nodeCommand = process.execPath;

const waitForDevServerUrl = (server: ReturnType<typeof spawn>): Promise<string> => (
  new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      reject(new Error(`web dev server did not start. stdout=${stdout} stderr=${stderr}`));
    }, 5000);

    server.stdout?.on('data', chunk => {
      stdout += String(chunk);
      const match = stdout.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    });
    server.stderr?.on('data', chunk => {
      stderr += String(chunk);
    });
    server.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    server.on('exit', code => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`web dev server exited with ${code}. stderr=${stderr}`));
      }
    });
  })
);

describe('web shell e2e smoke', () => {
  it('serves first-screen html and javascript from the real dev server', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')) as {
      scripts: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const forbiddenPackages = ['@playwright/test', 'playwright', 'vite', 'react', 'react-dom', 'next', 'tailwindcss'];

    expect(packageJson.scripts['test:e2e']).toBe('vitest run tests/e2e');
    expect([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {})
    ]).not.toEqual(expect.arrayContaining(forbiddenPackages));

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await execFileAsync(npmCommand, ['run', 'build:web'], {
      cwd: rootDir,
      shell: process.platform === 'win32'
    });

    const server = spawn(nodeCommand, ['scripts/dev-web-app.cjs', '--port', '0'], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    try {
      const url = await waitForDevServerUrl(server);
      const htmlResponse = await fetch(url);
      const html = await htmlResponse.text();
      const jsResponse = await fetch(new URL('/src/main.js', url));
      const js = await jsResponse.text();
      const shellResponse = await fetch(new URL('/src/app-shell.js', url));
      const shellJs = await shellResponse.text();

      expect(htmlResponse.status).toBe(200);
      expect(html).toContain('StorySpec Web');
      expect(html).toContain('src="./src/main.js"');
      expect(jsResponse.status).toBe(200);
      expect(js).toContain('renderIndependentWebAppHtml');
      expect(shellResponse.status).toBe(200);
      expect(shellJs).toContain('登录与权限');
      expect(shellJs).toContain('错误边界');
      expect(shellJs).toContain('候选与正典审阅');
      expect(shellJs).toContain('任务中心');
      expect(shellJs).toContain('apply-confirmed');
      expect(shellJs).toContain('fallback');
    } finally {
      server.kill();
    }
  });
});
