---
change_type: minor
scope: app,cli,docs
---

# 本机 App 大纲候选与任务板视图

## App 行为

- 本机工作台页面新增规划面板，可列出候选大纲、从作者文本创建候选、比较两个候选、查看提升预览和读取只读任务板。
- 新增本机 App API：
  - `GET /api/outlines/list`：列出当前故事候选大纲。
  - `POST /api/outlines/create`：从作者文本保存候选大纲。
  - `POST /api/outlines/compare`：比较两个候选大纲的主线目标、人物弧线、节奏、风险和读者承诺。
  - `POST /api/outlines/promote`：调用候选提升服务；默认 dry-run。
  - `GET /api/tasks/board`：读取任务板，使用 `write: false`，不修改 `tasks.md`。
- 新增 API 全部要求 session token，并且只作用于当前 App session 已打开或已创建的项目。
- 候选大纲提升默认不覆盖正式 `creative-plan.md`，也不自动修改正文、tracking、tasks 或 canon。

## CLI 行为

- `storyspec app` 启动时会把现有 outline candidate 服务和 `exportTaskBoard()` 注入本机 App core。
- CLI 启动输出仍不暴露 session token。

## 文档

- README 同步本机工作台已可管理候选大纲和读取只读任务板，并继续说明章节编辑器尚未实现。
- App 路线图同步为“下一步章节入口”。

## 模板契约

无模板契约变化。本次不修改 `templates/commands/*.md`、项目初始化模板、agent prompt 模板或命令生成 manifest。

## 生成产物

无生成产物变化。本次不手工编辑 `dist/**`，也不更新命令生成产物。发布前仍由构建流程生成最新 CLI 输出。

## 验证

- `npx openspec validate add-local-app-outline-task-views --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts tests/unit/local-app-command.test.ts`
- `npm run build`
