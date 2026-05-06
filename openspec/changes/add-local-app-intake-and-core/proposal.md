## Why

本机工作台已经能打开页面、选择/创建项目和读取项目状态，但作者仍要回到 CLI 才能完成第一步创作动作：保存一句灵感、粘贴长文资料、查看核心缺口。App 第一阶段下一项应把这些低风险、高频入口接进页面，让“打开项目 -> 输入素材 -> 看缺口/候选 -> 决定是否继续”形成闭环，同时继续保护 preview / confirm / apply。

## What Changes

- 本机 App server core 新增当前项目范围内的创作入口 API：
  - 创建故事创意草稿：复用 `createStoryIdea()`。
  - 吸收长文资料预览：复用 `ingestStoryInput()`，默认 preview-only。
  - 读取核心缺口：复用 `createStoryCoreSummary({ missingOnly: true })`。
- HTTP server 新增对应 `/api/stories/*` endpoint，全部要求 session token，并且只允许作用于当前已打开或已创建项目。
- 本机工作台页面新增“创作入口”区域，支持一句灵感、长文资料和核心缺口刷新。
- 高影响写入仍不绕过确认门禁：长文吸收默认只预览；只有用户显式勾选“写入明确表达字段”时，才使用现有 `applyConfirmed` 语义写入 clarifications。

## Non-goals

- 不做完整 React/Vite 前端重写。
- 不做富文本编辑器、章节正文编辑器或大纲/任务看板。
- 不做账号、多用户、云端数据库或部署。
- 不实现 preview apply UI；本 change 只展示候选、缺口和 CLI 可复制下一步。
- 不让 AI 候选直接进入正典、规格、计划或正文。

## Impact

影响本地 App server core、HTTP endpoint、本机工作台 HTML、CLI 启动依赖注入、单元测试、README、changeset 和 App 路线图。不手工编辑 `dist/**`。

## Capabilities

- `local-app-intake-and-core`
