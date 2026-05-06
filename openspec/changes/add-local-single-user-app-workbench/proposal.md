## Why

StorySpec 当前主要通过 CLI 和 agent prompt 驱动，作者需要理解目录、命令和文件产物。用户已确认第一阶段先做“本机 Web 工作台”，让作者运行 `storyspec app` 后在浏览器里打开或创建本地 StorySpec 项目，并查看工作台首屏。

## What Changes

- 新增 `storyspec app` 本机工作台入口。
- 建立本地 App 项目能力：校验 StorySpec 项目根目录、记录最近打开项目、创建新项目时复用 `initProject()` 且默认 agent 为 `codex`。
- 建立本地服务基础：默认绑定 `127.0.0.1`，使用 session token，API 只能访问用户已选择或创建的项目根目录。
- 建立工作台首屏状态 API，复用 `getProjectStatus()` 输出当前项目状态、故事阶段、缺口和下一步建议。
- 第一版先打通后端和 CLI 地基，前端采用 `Vite + React + TypeScript` 与纸面档案 + 本机写作控制台视觉方向分阶段接入。

## Non-goals

- 不做账号系统、多用户项目隔离、云端数据库或生产部署。
- 不做多人协作、共享链接、公开社区、计费或用量套餐。
- 不默认引入富文本编辑器。
- 不移除或削弱现有 CLI。
- 不允许 App 绕过 preview / confirm / apply。

## Impact

影响 CLI 命令注册、本地 App 应用服务、本地服务边界、单元测试、smoke、文档和 changeset。由于涉及新 CLI/API 行为与架构入口，本 change 必须 OpenSpec-first。

## Capabilities

- `local-single-user-app-workbench`
