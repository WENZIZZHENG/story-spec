## Why

章节前置约束卡已经能让 agent 在写正文前确认人物情绪顺序、能力边界、语言水平、权力关系和世界观一致性。但当前 `/write`、Scene Card 工作流和章节卡模板的表述偏向“写中背约束卡”，容易让正文生成变成逐条审查，牺牲角色身体感、现场反应和句子质感。

本变更调整约束卡的使用时机：约束卡用于写前确认事实边界和写后自检，不作为正文生成时的逐句审查器。正文起草阶段应优先追求身体感、感官、动作、当下反应和句子质感。

## What Changes

- 更新章节卡模板、`/write`、`write.prompt.md`、`scene`、`CONTINUE.md` 和 agent guide，明确“写前确认约束 -> 写中沉浸起草 -> 写后对照自检”。
- 增加测试覆盖章节卡模板和生成后的 agent command prompt 必须包含写中沉浸原则。
- 重建命令产物和 manifest。
- 新增 changeset，并更新待办状态和归档。

## Capabilities

### Modified Capabilities

- `chapter-preflight-constraint-card`: 章节前置约束卡从写中审查姿态调整为写前确认和写后自检。
- `authoring-continuation-kit`: 继续写作入口提醒 agent 在正文阶段优先沉浸起草。

## Impact

影响范围包括 `templates/authoring/chapter-card.md`、`templates/CONTINUE.md`、`agent-guides/story-creation-guide.md`、`docs/agent-guides/story-creation-guide.md`、`templates/commands/write.md`、`templates/commands/write.prompt.md`、`templates/commands/scene.md`、命令生成产物 manifest、相关单元测试、技术待办、归档和 changeset。不新增 CLI，不改故事实例数据，不引入运行时依赖。
