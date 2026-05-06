---
change_type: minor
scope: app,cli,docs
---

# 本机 App 章节草稿入口

## App 行为

- 本机工作台页面新增章节入口，可创建章节草稿、列出草稿、查看草稿发布 dry-run、初始化 Scene Card，并运行章节级写后自检。
- 新增本机 App API：
  - `POST /api/chapters/drafts/create`：在当前项目中创建章节草稿，不覆盖正式正文。
  - `GET /api/chapters/drafts/list`：列出当前故事或章节的草稿记录。
  - `POST /api/chapters/drafts/promote`：调用草稿发布服务；页面默认 dry-run。
  - `POST /api/chapters/scene/init`：初始化 Scene Card。
  - `POST /api/chapters/review`：运行章节级 reviewer loop，输出 findings 和任务草稿。
- 新增 API 全部要求 session token，并且只作用于当前 App session 已打开或已创建的项目。
- 章节入口不提供富文本编辑器，不自动写正文，不默认发布草稿，也不自动修改 `tasks.md`、tracking 或 canon。

## CLI 行为

- `storyspec app` 启动时会把现有 `createDraft()`、`listDrafts()`、`promoteDraft()`、`createInitialSceneCard()` 和 `reviewProject()` 注入本机 App core。
- CLI 启动输出仍不暴露 session token。

## 文档

- README 同步本机工作台已覆盖创作入口、规划面板、章节草稿入口和写后自检，并继续说明账号、云端、多用户和富文本编辑器尚未实现。
- App 路线图和待办入口同步为本机 Web 工作台第一阶段完成；多用户账号与项目隔离仍是后续中期路线，不在本次实现范围内。

## 模板契约

无模板契约变化。本次不修改 `templates/commands/*.md`、项目初始化模板、agent prompt 模板或命令生成 manifest。

## 生成产物

无生成产物变化。本次不手工编辑 `dist/**`，也不更新命令生成产物。发布前仍由构建流程生成最新 CLI 输出。

## 验证

- `npx openspec validate add-local-app-chapter-entry --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts tests/unit/local-app-command.test.ts`
- `npm run build`
