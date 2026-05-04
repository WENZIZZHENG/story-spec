---
change_type: patch
scope: cli
---

# 让 next 推荐命令可复制执行

## CLI 行为

- `storyspec next` 的 interview 推荐命令现在会带上从当前故事 premise 或 `idea.md` 提取的 `--premise`，避免新手复制第一条命令后在非交互环境被阻断。
- `storyspec interview` 在未显式传入 `--premise` 时，会优先复用已有澄清记录 premise，再读取 `stories/<story>/idea.md` 的“用户原文”作为访谈 premise。
- 如果找不到任何 premise 来源，错误提示会包含一条完整可复制的 `storyspec interview <story> --premise "一句话创意"` 示例。
- `storyspec next --json` 的 action、entrypoint 和 today mode 输出增加 `copyableCommand` 与 `requiresPremise` 字段，便于 agent/UI 直接使用。

## 模板契约

- 无模板契约变化。

## 生成产物

- `stories/<story>/idea.md` 的“下一步”示例改为使用同一套 CLI 命令构建逻辑，确保引号转义一致。
- `interview` 仍只把 premise 作为访谈上下文，不会把 `idea.md` 自动写成正典。

## 验证

- 已运行 `npm run build`。
- 已运行 `npx vitest run tests/unit/story-onboarding.test.ts tests/unit/interview-story.test.ts`。
- 已运行 `npm run check:changes`。
- 已运行 `git diff --check`。
- 已运行 CLI smoke：临时项目内执行 `story:new -> next --json -> next -> interview --focus stage`，确认 JSON/text 推荐含 `--premise`，且 `interview` 可从 `idea.md` 回退 premise。
