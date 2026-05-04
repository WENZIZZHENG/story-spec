---
change_type: patch
scope: cli,application,tests
---

# Scene Card 初始化带入故事上下文

## CLI 行为

- `storyspec scene:init <story>` 现在通过应用层创建 Scene Card，并在输出中提示候选上下文数量和下一步检查命令。
- 已存在 Scene Card 时仍会阻止覆盖。

## 模板契约

- Scene Card 初始化会把 `stories/<story>/clarifications.json` 中已确认的作者答案写入 `storyContext.confirmed`。
- 默认 `requiredReads`、`allowedWrites` 和 `draftPath` 会从 `stories/*` 替换为当前故事路径。
- 模板中的示例 `world.example.rule` / `canon.example.fact` 不再作为初始化后的主引用保留，未确认世界事实会落到 pending 占位。

## 生成产物

- `stories/<story>/scenes/<scene-id>.yaml` 会包含 `storyContext`、当前故事的 `requiredReads` 和候选 reveal。
- 自动带入的内容只作为 Scene Card 候选上下文，不新增正典事实。

## 验证

- 新增 `tests/unit/create-scene-card.test.ts`。
- 已运行 `npm run build` 与 `npx vitest run tests/unit/create-scene-card.test.ts tests/unit/story-structure.test.ts tests/unit/inspect-story-structure.test.ts`。
