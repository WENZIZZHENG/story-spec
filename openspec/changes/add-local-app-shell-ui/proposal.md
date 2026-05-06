## Why

`storyspec app` 已经能启动本机 HTTP 服务并提供项目 API，但浏览器打开后还没有真实工作台页面。用户已经明确指出之前的 HTML 设计太丑，并要求参考已归档的 UI skill 重新设计。第一阶段应先把本机 App 从“只有 API 地基”推进到“可打开、可选择项目、可看首屏状态”的真实页面，同时保持本地文件和确认门禁边界。

## What Changes

- 新增本机工作台 HTML shell，由现有 Node HTTP server 直接托管 `/` 页面。
- 页面使用“纸面档案 + 本机写作控制台”视觉方向，采用克制、密集、可扫描的信息结构。
- 页面支持查看最近项目、打开项目、创建项目和读取当前项目状态。
- `storyspec app --project <path>` 启动后应在本次 session 中预打开该项目，让页面首屏能直接显示状态。
- 页面内置 session token，不在 CLI 输出中展示 token；API 仍必须校验 token。

## Non-goals

- 不引入 Vite/React/Tailwind 构建链；本 change 先做零依赖本机页面。
- 不做账号、多用户、云端数据库或部署。
- 不做富文本编辑器。
- 不新增高影响写入能力；打开/创建项目以外，首屏只读取状态和给出下一步。
- 不绕过 preview / confirm / apply。

## Impact

影响本地 App HTTP server、App CLI 启动流程、单元测试、smoke、README、changeset 和 App 路线图。仍不手工编辑 `dist/**`。

## Capabilities

- `local-app-shell-ui`
