---
change_type: minor
scope: agent,templates,docs
---

# Agent 小说创建引导协议

## CLI 行为

- `storyspec init` 会安装 `.specify/agent-guides/story-creation-guide.md`，作为不同 agent 共用的小说创建引导协议。
- `storyspec init` / `storyspec upgrade` 的 agent 集成可携带工具专属入口文件，例如 `CLAUDE.md`、`.cursor/rules/story-spec.mdc` 和 `.continue/rules/story-spec.md`。
- 用户通过不同 agent 询问 StorySpec 怎么开始时，入口文件会引导 agent 先读取中心协议，而不是只解释概念。

## 模板契约

- `AGENTS.md` / `.specify/agent-contract.md` 增加主动引导规则：遇到 story-spec、小说创建、剧情设定、章节规划或“怎么开始”时，先读取中心协议。
- 新增中心协议 `agent-guides/story-creation-guide.md`，要求首轮最多问 6 个低负担问题，并区分作者已确认、agent 建议和待确认。
- 新增或同步工具入口：`CLAUDE.md`、`.gemini/GEMINI.md`、`.cursor/rules/story-spec.mdc`、`.continue/rules/story-spec.md`、`.github/copilot-instructions.md`。
- Continue 入口明确只读降级输出目标路径、建议内容、补丁式说明和无法验证项。

## 生成产物

- `dist/*/.specify/agent-guides/story-creation-guide.md` 会随各 agent 构建产物生成。
- `dist/claude/CLAUDE.md`、`dist/gemini/.gemini/GEMINI.md`、`dist/cursor/.cursor/rules/story-spec.mdc`、`dist/continue-check/.continue/rules/story-spec.md`、`dist/copilot/.github/copilot-instructions.md` 会进入 manifest。
- 文档新增 `docs/agent-guides/story-creation-guide.md`，说明“中心协议 + 多入口适配”的维护方式。

## 验证

- 已运行 `npm run build`。
- 已运行 `npm test`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run check:command-manifest`。
- 已运行 `git diff --check`。
