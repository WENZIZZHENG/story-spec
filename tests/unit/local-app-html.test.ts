import { describe, expect, it } from 'vitest';
import { renderLocalAppHtml } from '../../src/app-server/local-app-html.js';

describe('local app html', () => {
  it('renders a restrained editor desk workbench shell with token-backed API wiring', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('StorySpec 本机工作台');
    expect(html).toContain('项目抽屉');
    expect(html).toContain('故事档案');
    expect(html).toContain('确认通道');
    expect(html).toContain('继续创作');
    expect(html).toContain('状态词');
    expect(html).toContain('最近项目');
    expect(html).toContain('打开项目');
    expect(html).toContain('创建项目');
    expect(html).toContain('下一步建议');
    expect(html).toContain('/api/projects/current/resume');
    expect(html).toContain('id="resume-lane"');
    expect(html).toContain('id="resume-action-command"');
    expect(html).toContain('secret-token');
    expect(html).toContain("x-storyspec-app-token");
  });

  it('keeps the shell away from marketing hero and generic AI gradient styling', () => {
    const html = renderLocalAppHtml({
      token: 'secret-token'
    }).toLowerCase();

    expect(html).not.toContain('hero');
    expect(html).not.toContain('linear-gradient');
    expect(html).not.toContain('glassmorphism');
    expect(html).not.toContain('backdrop-filter');
    expect(html).not.toContain('purple');
    expect(html).not.toContain('blueviolet');
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

    expect(html).toContain('规划面板');
    expect(html).toContain('候选大纲');
    expect(html).toContain('创建候选');
    expect(html).toContain('比较候选');
    expect(html).toContain('提升预览');
    expect(html).toContain('默认 dry-run');
    expect(html).toContain('任务板');
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

    expect(html).toContain('章节入口');
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
