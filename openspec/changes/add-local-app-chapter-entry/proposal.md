## Why

本机工作台已经覆盖项目打开、素材入口、核心缺口、候选大纲和只读任务板。作者进入章节生产时仍要回到 CLI 串联 `scene:init`、`draft:new`、`draft:list`、`draft:promote` 和 `review`，页面缺少一个“准备写章 / 写后检查”的最小入口。

本 change 把现有章节草稿、Scene Card 初始化和 reviewer 自检能力接入本机 App，让作者能在页面里创建章节草稿、查看草稿记录、预览发布目标、初始化首张 Scene Card，并运行章节级写后自检。它不做富文本编辑器，也不让页面直接改正文内容。

## What Changes

- 本机 App server core 新增章节相关方法：
  - 创建章节草稿：复用 `createDraft()`，不覆盖正式 `content/<chapter>.md`。
  - 列出章节草稿：复用 `listDrafts()`。
  - 发布草稿预览：复用 `promoteDraft()`，默认 dry-run；只有显式 `yes: true` 才发布到正式正文。
  - 初始化 Scene Card：复用 `createInitialSceneCard()`。
  - 章节自检：复用 `reviewProject()`，支持按 chapter 过滤。
- HTTP server 新增 `/api/chapters/drafts/create`、`/api/chapters/drafts/list`、`/api/chapters/drafts/promote`、`/api/chapters/scene/init`、`/api/chapters/review`。
- 本机工作台页面新增“章节入口”：草稿创建、草稿列表、发布预览、Scene Card 初始化、写后自检结果摘要。
- CLI `storyspec app` 启动时注入真实章节服务。
- README、changeset、App 路线图和待办入口同步为真实状态。

## Non-goals

- 不做完整富文本编辑器、实时编辑器或正文在线编辑。
- 不自动调用 AI 写正文。
- 不绕过 `/write`、Scene Card、Context Pack、任务边界或 preview / confirm / apply。
- 不默认发布草稿到正式 `content/`。
- 不创建统一 preview / apply 队列；如后续需要，单独走 `add-local-app-preview-apply-lane`。
- 不推进账号系统、云端数据库、多用户项目隔离或部署。

## Impact

影响本地 App server core、HTTP endpoint、本机工作台 HTML、CLI 启动依赖注入、单元测试、README、changeset 和 App 路线图。不手工编辑 `dist/**`。

## Capabilities

- `local-app-chapter-entry`
