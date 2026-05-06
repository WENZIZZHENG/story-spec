---
change_type: minor
scope: cli,app,docs
---

# 本机 App 工作台页面

## CLI 行为

- `storyspec app` 现在会在本机服务根路径 `/` 托管一个可浏览的工作台页面。
- `storyspec app --project <path>` 启动后会尝试在当前 session 预打开该 StorySpec 项目；失败时服务仍启动，并在 CLI 输出中说明未打开原因。
- CLI 启动输出不会暴露本机 session token；浏览器页面用内联 token 调用同源 API。

## App 页面

- 新增零依赖 HTML/CSS/JS 工作台 shell，不引入 Vite、React、Tailwind 或云端框架。
- 页面采用“编辑台 / 档案控制台”方向，包含项目抽屉、最近项目、打开/创建项目、故事档案、下一步建议和确认通道。
- 页面调用现有本机 API 读取 health、最近项目和当前项目状态，并在打开或创建项目后刷新状态。
- API token 校验和项目 allowlist 边界保持不变；页面不新增高影响写入能力，也不绕过 preview / confirm / apply。

## 文档

- README 更新为真实可用的本机页面能力，并继续说明账号、云端、多用户和富文本编辑器尚未实现。
- App 路线图同步为“零依赖本机 shell 已完成，下一步继续核心创作入口和大纲/任务视图”。

## 模板契约

无模板契约变化。本次不修改 `templates/commands/*.md`、项目初始化模板、agent prompt 模板或命令生成 manifest。

## 生成产物

无生成产物变化。本次不手工编辑 `dist/**`，也不更新命令生成产物。发布前仍由构建流程生成最新 CLI 输出。

## 验证

- `npx openspec validate add-local-app-shell-ui --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-html.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-command.test.ts`
- `npm run build`
