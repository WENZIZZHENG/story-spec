---
change_type: patch
scope: agent,templates,docs
---

# 小说创建入口优先引导

## CLI 行为

- 无 CLI 参数或命令行为变化。
- `storyspec init` / `storyspec upgrade` 仍通过现有模板和 agent 集成安装引导文件。

## 模板契约

- `.specify/agent-guides/story-creation-guide.md` 的引导顺序改为先带作者选择创作入口，再进入少量问题和 StorySpec 草案。
- 创作入口明确为一句灵感、主角、世界观、一幕场景或类型方向，避免 agent 先抛安装命令和文件结构。
- 第一版 StorySpec 草案要求固定区分“作者已确认 / agent 建议 / 待确认”，并在结尾给出玩角色、写一幕、整理设定、比较分支或进入章节规划的下一步。
- 同步更新 Claude、Gemini、Cursor、Continue、Copilot 和通用 agent contract 入口提示。

## 生成产物

- agent 命令构建产物中的 `.specify/agent-guides/story-creation-guide.md` 和工具入口文件内容会随模板更新。
- `tests/fixtures/command-artifacts.manifest.json` 需要同步更新对应哈希。

## 验证

- 已运行 `npm run build`。
- 已运行 `npm test`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run update:command-manifest`。
- 已运行 `npm run check:command-manifest`。
- 已运行 `npm run check:changes`。
- 已运行 `git diff --check`。
