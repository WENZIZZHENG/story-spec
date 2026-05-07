## Why

P2 待办要求统一 `preview / apply / dry-run / blocked / Active / Planned` 等状态语义，并让作者重新打开项目后能快速回到“最近项目、当前状态、下一步”。现有 `storyspec status`、`storyspec next` 和本机 App 已经各自有项目状态、故事下一步和最近项目能力，但用户仍需要在多个区域之间拼出“我现在能做什么、会不会写入文件、下一步命令是什么”。

## What Changes

- 新增一个轻量的继续创作回流模型，复用 `getProjectStatus` 的事实源：
  - 输出当前项目、当前故事、阶段、统一状态标签、主要下一步、可复制命令和写入边界。
  - 统一展示候选、预览、确认写入、dry-run、阻断和只读等状态含义。
  - 对无故事、idea/interviewing、specified/planned、tasked/drafting/revising 等阶段给出明确下一跳。
- 本机 App core 暴露 token-protected 的当前继续创作摘要；HTTP 新增 `/api/projects/current/resume`。
- App 首屏新增“继续创作”区域，把当前状态、下一步和边界放在项目打开后的统一入口。
- README、changeset 和待办归档同步真实能力与边界。

## Non-goals

- 不改变 preview / confirm / apply、dry-run、candidate、blocked 等既有门禁行为。
- 不新增数据库、账号系统、云端同步、多用户隔离或前端框架。
- 不自动执行下一步命令，不自动写入正文、specification、creative-plan、tasks、tracking 或 canon。
- 不重做 `storyspec next` 的完整入口卡，只提供一张回流摘要卡。

## Impact

影响范围包括 `src/application/get-project-status.ts` 或邻近 application 模块、`src/app-server/local-app-server.ts`、`src/app-server/local-app-http-server.ts`、`src/app-server/local-app-html.ts`、README、changeset、待办和归档文档，以及相关 unit/http/html 测试。不手工编辑 `dist/**`。

## Capabilities

- `status-resume-lane`
