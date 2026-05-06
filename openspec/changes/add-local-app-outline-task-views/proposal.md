## Why

本机工作台已经能打开项目、保存灵感、吸收资料和查看核心缺口。下一步需要把规划阶段的可视化能力接入页面：作者应能在 App 中看到多个大纲候选、创建一个候选、比较两个候选、查看提升预览，并读取任务板状态。这样 App 不再只覆盖“素材入口”，也开始覆盖“计划选择与执行准备”。

## What Changes

- 本机 App server core 新增当前项目范围内的大纲和任务 API：
  - 列出大纲候选：复用 `listOutlineCandidates()`。
  - 从作者文本创建候选大纲：复用 `createOutlineCandidate()`。
  - 比较两个候选：复用 `compareOutlineCandidates()`。
  - 提升候选：复用 `promoteOutlineCandidate()`，默认 dry-run；只有显式 `yes: true` 才覆盖正式 `creative-plan.md`。
  - 读取任务板：复用 `exportTaskBoard({ write: false })`。
- HTTP server 新增 `/api/outlines/*` 与 `/api/tasks/board` endpoint，全部要求 session token，并且只作用于当前已打开或已创建项目。
- 本机工作台页面新增“规划面板”：候选大纲列表、候选创建、候选比较、提升预览和任务板摘要。
- 文档和待办同步到“下一步章节入口”。

## Non-goals

- 不做完整拖拽任务看板。
- 不做章节草稿编辑器、富文本编辑器或正文写作入口。
- 不做 AI 自动生成大纲候选。
- 不默认执行 promote 写入；页面第一版以 dry-run 提升预览为主。
- 不绕过 preview / confirm / apply 或 outline promote 的显式确认门禁。

## Impact

影响本地 App server core、HTTP endpoint、本机工作台 HTML、CLI 启动依赖注入、单元测试、README、changeset 和 App 路线图。不手工编辑 `dist/**`。

## Capabilities

- `local-app-outline-task-views`
