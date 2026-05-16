import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  buildIndependentWebAppShell,
  renderIndependentWebAppHtml
} from '../../apps/web/src/app-shell.js';

describe('independent web app shell', () => {
  it('defines an independent web shell contract without replacing the local fallback', () => {
    const shell = buildIndependentWebAppShell();

    expect(shell.projectRoot).toBe('apps/web');
    expect(shell.apiClient).toEqual({
      baseUrl: '/api',
      tokenHeader: 'x-storyspec-app-token',
      authState: 'session-bound'
    });
    expect(shell.routes.map(route => route.id)).toEqual([
      'project-workspace',
      'story-cockpit',
      'chapter-writing',
      'canon-review',
      'task-center'
    ]);
    expect(shell.boundaries).toEqual(expect.arrayContaining([
      'candidate、preview、dry-run 和 apply-confirmed 在界面中必须保持可区分。',
      '本机 storyspec app shell 仍保留为 fallback，不由 apps/web 首片替换。'
    ]));
    expect(shell.nonGoals).toEqual(expect.arrayContaining([
      '本切片不引入 React、Vite、Next、Tailwind、实时协作或富文本编辑器。'
    ]));
  });

  it('renders a static first-screen shell with route and API boundary language', () => {
    const html = renderIndependentWebAppHtml(buildIndependentWebAppShell());

    expect(html).toContain('<main id="storyspec-web-root"');
    expect(html).toContain('StorySpec Web');
    expect(html).toContain('项目与工作区');
    expect(html).toContain('故事驾驶舱');
    expect(html).toContain('章节与写作');
    expect(html).toContain('候选与正典审阅');
    expect(html).toContain('任务中心');
    expect(html).toContain('x-storyspec-app-token');
    expect(html).toContain('apply-confirmed');
    expect(html).toContain('fallback');
    expect(html).not.toContain('contenteditable');
  });

  it('ships a static html entry that mounts the web shell module', async () => {
    const html = await readFile(new URL('../../apps/web/index.html', import.meta.url), 'utf8');

    expect(html).toContain('<div id="storyspec-web-root">');
    expect(html).toContain('src="./src/main.ts"');
    expect(html).toContain('StorySpec Web');
  });
});
