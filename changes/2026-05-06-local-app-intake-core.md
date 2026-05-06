---
change_type: minor
scope: app,cli,docs
---

# 本机 App 创作入口与核心缺口

## App 行为

- 本机工作台页面新增“创作入口”区域，可保存一句灵感、吸收长文资料预览、查看核心缺口。
- 新增本机 App API：
  - `POST /api/stories/create`：在当前已打开项目中创建故事创意草稿。
  - `POST /api/stories/ingest`：在当前已打开项目中吸收长文资料，默认 preview-only。
  - `GET /api/stories/core/missing`：读取当前故事缺失或未完成的核心信息。
- 新增 API 全部要求 session token，并且只作用于当前 App session 已打开或已创建的项目。
- 长文资料默认不写入；只有用户显式勾选“写入明确表达字段”时，才复用现有 `applyConfirmed` 语义写入作者明确表达字段，AI 候选仍保留为候选。

## CLI 行为

- `storyspec app` 启动时会把现有 `createStoryIdea()`、`ingestStoryInput()` 和 `createStoryCoreSummary()` 注入本机 App core。
- CLI 启动输出仍不暴露 session token。

## 文档

- README 同步本机工作台已可执行的创作入口能力，并继续说明账号、云端、多用户、富文本、大纲任务看板和章节编辑器尚未实现。
- App 路线图同步为“创作入口与核心缺口已完成，下一步继续大纲/任务视图和确认队列”。

## 模板契约

无模板契约变化。本次不修改 `templates/commands/*.md`、项目初始化模板、agent prompt 模板或命令生成 manifest。

## 生成产物

无生成产物变化。本次不手工编辑 `dist/**`，也不更新命令生成产物。发布前仍由构建流程生成最新 CLI 输出。

## 验证

- `npx openspec validate add-local-app-intake-and-core --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts tests/unit/local-app-command.test.ts`
- `npm run build`
