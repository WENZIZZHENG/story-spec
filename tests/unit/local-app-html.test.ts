import { describe, expect, it } from 'vitest';
import { createContext, Script } from 'node:vm';
import { renderLocalAppHtml } from '../../src/app-server/local-app-html.js';

const runLocalAppScripts = async (
  html: string,
  responses: Record<string, { ok: boolean; body: unknown }>
) => {
  const elements = new Map<string, {
    appendChild: (child: unknown) => void;
    children: unknown[];
    className: string;
    hidden: boolean;
    innerHTML: string;
    textContent: string;
    type: string;
    value: string;
    addEventListener: () => void;
  }>();
  const getElement = (selector: string) => {
    const key = selector.startsWith('#') ? selector.slice(1) : selector;
    const existing = elements.get(key);
    if (existing) return existing;
    const element = {
      appendChild: (child: unknown) => {
        element.children.push(child);
      },
      children: [] as unknown[],
      className: '',
      hidden: false,
      innerHTML: '',
      textContent: '',
      type: '',
      value: '',
      addEventListener: () => undefined
    };
    elements.set(key, element);
    return element;
  };
  const context = createContext({
    console,
    document: {
      createElement: () => getElement(`created-${elements.size}`),
      querySelector: getElement
    },
    fetch: async (url: string) => {
      const response = responses[url] || { ok: false, body: { blockedReasons: ['未 mock'] } };
      return {
        ok: response.ok,
        json: async () => response.body
      };
    },
    FormData: class {},
    URLSearchParams,
    window: {}
  });
  const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g)).map(match => match[1]);
  scripts.forEach((script, index) => {
    new Script(script, { filename: `local-app-html-${index}.js` }).runInContext(context);
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  return { elements };
};

describe('local app html', () => {
  it('renders the studio workbench shell with story cockpit navigation', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('StorySpec 工作室');
    expect(html).toContain('项目与故事');
    expect(html).toContain('故事驾驶舱');
    expect(html).toContain('章节与写作');
    expect(html).toContain('候选与正典');
    expect(html).toContain('任务中心');
    expect(html).toContain('协作侧栏');
    expect(html).toContain('Preview / Confirm / Apply');
    expect(html).toContain('aria-label="完整 App 首批页面导航"');
    expect(html).toContain('data-route-id="project-workspace"');
    expect(html).toContain('data-route-id="story-cockpit"');
    expect(html).toContain('data-route-id="chapter-writing"');
    expect(html).toContain('data-route-id="canon-review"');
    expect(html).toContain('data-route-id="task-center"');
    expect(html).toContain('前端 API 地图');
    expect(html).toContain('data-endpoint-id="current-app-state"');
    expect(html).toContain('data-endpoint-id="story-ingest"');
    expect(html).toContain('data-endpoint-id="chapter-draft-promote"');
    expect(html).toContain('最近项目');
    expect(html).toContain('打开项目');
    expect(html).toContain('创建项目');
    expect(html).toContain('下一步建议');
    expect(html).toContain('/api/projects/current/app-state');
    expect(html).toContain('/api/projects/current/resume');
    expect(html).toContain('id="app-state-root"');
    expect(html).toContain('id="story-cockpit-panel"');
    expect(html).toContain('id="resume-lane"');
    expect(html).toContain('id="resume-action-command"');
    expect(html).toContain('secret-token');
    expect(html).toContain("x-storyspec-app-token");
  });

  it('renders a guided first-run path before the dense workbench controls', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('id="guided-first-run"');
    expect(html).toContain('开始路径');
    expect(html).toContain('1. 打开或创建项目');
    expect(html).toContain('2. 创建或选择故事');
    expect(html).toContain('3. 继续写作或审阅候选');
    expect(html).toContain('href="#open-project-form"');
    expect(html).toContain('href="#story-idea-form"');
    expect(html).toContain('href="#confirm-lane-title"');
    expect(html).toContain('候选和预览不会自动写入正式故事');
    expect(html).toContain('data-guide-step="project"');
    expect(html).toContain('data-guide-step="story"');
    expect(html).toContain('data-guide-step="review"');
  });

  it('uses studio workbench styling instead of paper dossier, marketing hero, or ops console styling', () => {
    const rawHtml = renderLocalAppHtml({
      token: 'secret-token'
    });
    const html = rawHtml.toLowerCase();

    expect(rawHtml).toContain('--app-bg: #f8fafc');
    expect(rawHtml).toContain('--accent: #2563eb');
    expect(rawHtml).toContain('--attention: #f97316');
    expect(rawHtml).toContain('sans-serif');
    expect(html).not.toContain('ui-serif');
    expect(rawHtml).not.toContain('纸面档案');
    expect(html).not.toContain('hero');
    expect(html).not.toContain('linear-gradient');
    expect(html).not.toContain('glassmorphism');
    expect(html).not.toContain('backdrop-filter');
    expect(html).not.toContain('purple');
    expect(html).not.toContain('blueviolet');
  });

  it('renders studio state language and author confirmation boundaries', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('候选方案');
    expect(html).toContain('预览变更');
    expect(html).toContain('试运行');
    expect(html).toContain('应用到正式故事');
    expect(html).toContain('暂时无法继续');
    expect(html).toContain('稍后决定');
    expect(html).toContain('正典 / 已确认事实');
    expect(html).toContain('草稿');
    expect(html).toContain('评论');
    expect(html).toContain('作者最终确认');
    expect(html).toContain('Agent 不能直接写入正典');
  });

  it('loads nested CompleteAppState cockpit, rail, pages, and write mode contract', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('const cockpit = appState.cockpit || {};');
    expect(html).toContain('const metrics = cockpit.metrics || {};');
    expect(html).toContain('const primaryAction = cockpit.primaryAction || {};');
    expect(html).toContain('appState.collaborationRail?.items');
    expect(html).toContain('appState.pages');
    expect(html).toContain('appState.writeModeLanguage');
    expect(html).toContain('Array.isArray(appState.writeModeLanguage)');
    expect(html).toContain('renderWriteModeLanguage(writeModeLanguage)');
    expect(html).toContain('item.value');
    expect(html).toContain('metrics.agentCandidates');
    expect(html).toContain('metrics.contentFiles');
    expect(html).toContain('metrics.contentChars');
    expect(html).toContain('Agent 候选');
    expect(html).toContain('正文文件');
    expect(html).toContain('正文字符');
    expect(html).toContain('cockpit.boundaries');
    expect(html).toContain('cockpit.storyName');
    expect(html).toContain('cockpit.stageLabel');
    expect(html).toContain('cockpit.currentBlocker');
    expect(html).not.toContain('appState.storyName');
    expect(html).not.toContain('appState.stageLabel');
    expect(html).not.toContain('appState.currentBlocker');
    expect(html).not.toContain('appState.pendingConfirmations');
    expect(html).not.toContain('appState.blockers');
    expect(html).not.toContain('appState.chapterFiles');
    expect(html).not.toContain('writeModeLanguage.preview');
    expect(html).not.toContain('writeModeLanguage.confirm');
    expect(html).not.toContain('writeModeLanguage.apply');
  });

  it('renders malformed nested app state without falling back to an app-state error panel', async () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    const { elements } = await runLocalAppScripts(html, {
      '/api/app/health': { ok: true, body: { ok: true } },
      '/api/projects/recent': { ok: true, body: [] },
      '/api/projects/current/status': { ok: false, body: { blockedReasons: ['尚未打开项目'] } },
      '/api/projects/current/resume': { ok: false, body: { blockedReasons: ['尚未打开项目'] } },
      '/api/projects/current/app-state': {
        ok: true,
        body: {
          cockpit: {
            storyName: '<script>alert(1)</script>',
            stageLabel: '草稿',
            currentBlocker: '',
            metrics: {},
            primaryAction: {
              label: '稍后决定',
              reason: '等待作者确认',
              writeMode: 'preview'
            },
            boundaries: [null, true, '作者最终确认']
          },
          collaborationRail: {
            items: [
              { label: '<img src=x onerror=alert(1)>', value: '<script>x</script>' },
              null,
              '评论'
            ]
          },
          pages: { id: 'not-array' },
          writeModeLanguage: []
        }
      }
    });

    const panelHtml = elements.get('story-cockpit-panel')?.innerHTML || '';

    expect(panelHtml).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(panelHtml).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(panelHtml).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(panelHtml).toContain('暂无工作区页面。');
    expect(panelHtml).toContain('预览变更 / 作者最终确认 / 应用到正式故事');
    expect(panelHtml).toContain('作者最终确认');
    expect(panelHtml).not.toContain('工作室会读取故事驾驶舱状态');
    expect(panelHtml).not.toContain('<script>');
    expect(panelHtml).not.toContain('<img');
  });

  it('renders accessible forms, inline errors, and empty status state', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('<label for="open-project-root">项目根目录</label>');
    expect(html).toContain('<label for="create-project-name">故事项目名</label>');
    expect(html).toContain('id="open-project-error"');
    expect(html).toContain('id="create-project-error"');
    expect(html).toContain('尚未打开项目');
    expect(html).toContain('选择一个 StorySpec 项目，或创建新项目。');
  });

  it('renders story intake, source preview, and core gap controls', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('创作入口');
    expect(html).toContain('一句灵感');
    expect(html).toContain('长文资料');
    expect(html).toContain('默认只预览');
    expect(html).toContain('写入明确表达字段');
    expect(html).toContain('核心缺口');
    expect(html).toContain('/api/stories/create');
    expect(html).toContain('/api/stories/ingest');
    expect(html).toContain('/api/stories/core/missing');
    expect(html).toContain('id="story-intake-result"');
    expect(html).toContain('id="source-intake-result"');
    expect(html).toContain('id="core-gaps-result"');
  });

  it('renders outline planning and read-only task board controls', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('候选与正典');
    expect(html).toContain('候选大纲');
    expect(html).toContain('创建候选');
    expect(html).toContain('比较候选');
    expect(html).toContain('提升预览');
    expect(html).toContain('默认 dry-run');
    expect(html).toContain('任务中心');
    expect(html).toContain('只读');
    expect(html).toContain('/api/outlines/list');
    expect(html).toContain('/api/outlines/create');
    expect(html).toContain('/api/outlines/compare');
    expect(html).toContain('/api/outlines/promote');
    expect(html).toContain('/api/tasks/board');
    expect(html).toContain('id="outline-list-result"');
    expect(html).toContain('id="outline-compare-result"');
    expect(html).toContain('id="outline-promote-result"');
    expect(html).toContain('id="task-board-result"');
  });

  it('renders chapter draft entry, scene card initialization, and post-write review controls without a rich text editor', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('章节与写作');
    expect(html).toContain('写作通道');
    expect(html).toContain('outline -> tasks -> scene -> sample -> draft -> review');
    expect(html).toContain('章节小样');
    expect(html).toContain('章节草稿');
    expect(html).toContain('创建草稿');
    expect(html).toContain('草稿列表');
    expect(html).toContain('发布预览');
    expect(html).toContain('默认 dry-run');
    expect(html).toContain('Scene Card 初始化');
    expect(html).toContain('写后自检');
    expect(html).toContain('/api/chapters/drafts/create');
    expect(html).toContain('/api/chapters/lane');
    expect(html).toContain('/api/chapters/drafts/list');
    expect(html).toContain('/api/chapters/drafts/promote');
    expect(html).toContain('/api/chapters/scene/init');
    expect(html).toContain('/api/chapters/review');
    expect(html).toContain('id="chapter-lane-result"');
    expect(html).toContain('id="chapter-draft-result"');
    expect(html).toContain('id="chapter-draft-list-result"');
    expect(html).toContain('id="chapter-promote-result"');
    expect(html).toContain('id="chapter-scene-result"');
    expect(html).toContain('id="chapter-review-result"');
    expect(html.toLowerCase()).not.toContain('contenteditable');
    expect(html.toLowerCase()).not.toContain('rich text');
  });
});
