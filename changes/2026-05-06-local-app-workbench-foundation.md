---
change_type: minor
scope: cli,app,docs
---

# 本机 Web 工作台地基

## CLI 行为

- 新增实验性 `storyspec app` 入口，作为本机 Web 工作台的启动地基。
- `storyspec app` 会启动只绑定 `127.0.0.1` 的本机 HTTP 服务。
- `storyspec app --json --no-open` 会输出本地地址、是否需要 session token、是否自动打开浏览器等启动预览信息，避免自动化检查被长驻服务阻塞。
- `storyspec --help` 现在展示 `app` 命令。

## App 地基

- 新增本地 App 项目能力：校验 StorySpec 项目根目录、打开项目并记录最近项目、创建项目时默认使用 `codex` agent 并复用 `initProject()`。
- 新增本地 App server core 和 HTTP endpoint：健康状态、session token 校验、最近项目列表、打开项目、创建项目、当前会话项目 allowlist、打开或创建项目后读取项目状态的基础边界。
- 第一版仍不提供账号、多用户隔离、云端数据库、完整前端工作台或富文本编辑器。

## 模板契约

无模板契约变化。本次不修改 `templates/commands/*.md`、项目初始化模板、agent prompt 模板或命令生成 manifest。

## 生成产物

无生成产物变化。本次不手工编辑 `dist/**`，也不更新命令生成产物。发布前仍由构建流程生成最新 CLI 输出。

## 文档

- 将“本机 Web 工作台”详细讨论同步到 App 路线图和 OpenSpec change。
- README 仅说明当前实验性入口，不把后续完整 App 功能写成已实现能力。

## 验证

- `npx openspec validate add-local-single-user-app-workbench --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-projects.test.ts tests/unit/local-app-server.test.ts tests/unit/local-app-command.test.ts`
- `npm run build`
