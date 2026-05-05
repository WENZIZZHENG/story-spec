---
change_type: patch
scope: docs,agent,quickstart
---

# 同步快速入门、首页和 agent 命令文档

## CLI 行为

- 快速入门主线统一为 `storyspec init --workspace <path> --agent codex`，让 Codex 前缀示例可直接照抄。
- 详细示例同步 `--workspace` 初始化写法，并说明非 Codex agent 需要按命令对照替换前缀。
- 安装指南补充 `storyspec check` 当前检查的 AI 工具范围。
- 升级指南补充 `status --json` / `codex-status --json` 的结构化首程导航检查方式。

## 模板契约

- 不修改 agent command 模板，仅修正文档中对命令前缀、命令目录和 prompt 文件入口的描述。
- Agent 命令对照同步 OpenCode、Amazon Q、Copilot 等 integration 的实际目录和命令形态。
- 文档首页同步为“共创型编辑台”口径，继续强调候选、确认、preview / apply 和写作阶段反馈。

## 生成产物

- 未修改 `templates/commands/**`、`dist/**` 或 command manifest。
- 不需要重新运行 `npm run build:commands`。

## 验证

- 需要运行 `npm run check:changes`。
