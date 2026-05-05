## Why

长篇连续写作中，章节开写前最容易漏掉的是当前时间点下的硬约束：人物情绪反应顺序、能力边界和代价、语言理解/表达水平、权力关系，以及已确认世界观规则。StorySpec 已有 Scene Card、章节卡、Context Pack 和写后验证，但这些能力还没有把“约束卡 -> 作者确认 -> 写正文 -> 自检对照 -> 更新状态”固定成写前流程。

本变更先交付轻量第一版：增强章节卡模板和 agent 写作 prompt，让正文前必须输出本章约束卡并等待确认。它不自动推断故事事实，不新增 CLI，不把未确认约束写入正典。

## What Changes

- 增强 `templates/authoring/chapter-card.md`，新增时间点、当前能力、情感检查点、硬约束、软约束和写后自检对照区块。
- 更新 `templates/CONTINUE.md`、`agent-guides/story-creation-guide.md`、`templates/commands/write.md` / `write.prompt.md` 和 `templates/commands/scene.md`，要求写正文前先输出约束卡并等待作者确认。
- 新增测试覆盖章节卡模板和生成后的 agent command prompt 必须包含约束卡流程。
- 重建 command artifacts 和 manifest，确保各 agent 生成产物同步。
- 更新 changeset 和活跃待办状态。

## Capabilities

### New Capabilities

- `chapter-preflight-constraint-card`: 章节写作前的约束卡模板、确认门禁和写后自检要求。

### Modified Capabilities

- `authoring-continuation-kit`: 继续创作入口和章节卡模板新增章节前置约束卡流程。

## Impact

影响范围包括 `templates/authoring/chapter-card.md`、`templates/CONTINUE.md`、`agent-guides/story-creation-guide.md`、`templates/commands/write.md`、`templates/commands/write.prompt.md`、`templates/commands/scene.md`、命令生成产物 manifest、相关单元测试、技术待办和 changeset。不手工编辑 `dist/`，不改故事实例数据，不新增运行时依赖。
