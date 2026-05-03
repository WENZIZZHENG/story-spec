---
change_type: minor
scope: repository,agent-commands,templates,docs
---

# 仓库迁移与 agent 入口精简

## CLI 行为

- 将 GitHub 仓库地址从 `https://github.com/wordflowlab` 迁移到 `https://github.com/WENZIZZHENG`。
- 删除技术文档中的 GitHub / Issues / Discussions 联系方式区块。
- 将 `docs/ai-platform-commands.md` 重命名为 `docs/agent-commands.md`，把主概念从 AI 平台命令收敛为 agent 命令。
- 将过期的 Codex 支持说明、外部 AI 快速整合指南和 Gemini 单点提示词移出当前文档入口。

## 模板契约

- 将 `templates/GEMINI.md` 和 `.specify/templates/GEMINI.md` 精简为 Gemini 薄适配层，只保留读取顺序、命令格式和协作边界。
- 删除旧的 `templates/AGENTS.codex.md` 专用兼容模板，统一使用 `AGENTS.md` 与 `.specify/agent-contract.md`。
- 新项目仍会生成通用 `AGENTS.md` 和 `.specify/agent-contract.md`；Gemini 用户仍使用 `/storyspec:命令名`，Codex 用户仍使用 `/storyspec-命令名`。

## 生成产物

- `tests/fixtures/command-artifacts.manifest.json` 已移除各 agent 产物中的 `.specify/templates/AGENTS.codex.md` 记录。
- `package.json`、CLI 帮助文本、升级提示和公开文档中的仓库地址已切换到 `WENZIZZHENG/story-spec`。

## 验证

- `npm run build`
- `npm test`
- 后续收尾还需运行 `npm run check:changes`、`npm run check:command-manifest`、`npm run build:commands`、`npm run test:smoke` 与 `git diff --check`。
