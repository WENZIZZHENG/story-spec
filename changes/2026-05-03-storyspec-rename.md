---
change_type: major
scope: branding,cli,agent-commands
---

# StorySpec 品牌与 CLI 重命名

## CLI 行为

- 项目品牌名从 Novel Writer 改为 StorySpec。
- npm 包名从 `novel-writer-cn` 改为 `story-spec-cn`。
- 终端 CLI 主命令从 `novel` 改为 `storyspec`，不保留 `novel` 兼容别名。
- CLI 横幅、帮助示例、README、快速开始和当前用户文档已同步使用 `storyspec ...`。

## 模板契约

- Agent 斜杠命令前缀统一切到 StorySpec 品牌：
  - Codex CLI：`/storyspec-write`
  - Claude Code：`/storyspec.write`
  - Gemini CLI：`/storyspec:write`
- Gemini 命令生成目录从 `.gemini/commands/novel/` 改为 `.gemini/commands/storyspec/`。
- Generic Markdown、Cursor、Windsurf、Roo Code、Copilot、Qwen、OpenCode、Kilo Code、Auggie、CodeBuddy、Amazon Q 继续使用无品牌前缀命令文件。

## 生成产物

- `tests/fixtures/command-artifacts.manifest.json` 已按新的 agent 命令文件名和 Gemini 目录更新。
- `package.json` 的 `bin` 只暴露 `storyspec`。
- `src/prompt/platform-renderers` 和 `src/prompt/build-commands` 已同步新的命名空间和输出路径。

## 验证

- `npm run build`
- `npm test`
- 后续收尾还需运行 `npm run check:changes`、`npm run check:command-manifest`、`npm run build:commands`、`npm run test:smoke` 与 `git diff --check`。
