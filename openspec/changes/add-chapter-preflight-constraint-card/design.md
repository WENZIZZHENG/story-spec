## Context

StorySpec 已经完成 Scene Card 写作前门禁：`/write` 要求目标章节或目标 scene 存在 Scene Card，`context:pack` 会把写作用途 Scene Card 标为 mustRead，章节写作会先输出 beat preview。`templates/authoring/chapter-card.md` 也要求作者确认目标、冲突、信息释放、情绪变化和能力边界。

缺口在于章节卡仍偏通用结构，没有单独承载“写错就崩人设/破规则”的本章硬约束，也没有把写后自检对照固定到 agent prompt。用户提出的“晏无章节约束卡”示例中，情感真实性、底层视觉规则、语言水平、人物反应、权力关系和世界观一致性都属于这类约束。

## Goals / Non-Goals

**Goals:**

- 让章节卡模板直接包含本章约束卡区块。
- 让 `/write` 和 Scene Card 工作流在正文前先输出约束卡，等待作者确认后再写正文。
- 让正文收尾时必须对照约束卡说明是否违反硬约束。
- 保持资料不足时的安全降级：缺信息标为待确认，不编造能力、语言或心理状态。

**Non-Goals:**

- 不新增 `storyspec chapter:preflight` CLI；该命令留给后续评估。
- 不自动推断角色心理、语言学习进度、能力数值或权力关系。
- 不把未确认约束写入 canon、tracking 或正文。
- 不修改用户项目下的 `stories/*`。

## Design

1. **章节卡模板是源事实。**  
   修改 `templates/authoring/chapter-card.md`，新增以下区块：
   - `时间点`
   - `本章约束卡`
   - `当前能力与语言水平`
   - `本章情感检查点`
   - `硬约束`
   - `软约束`
   - `写后自检对照`

2. **agent prompt 执行确认门禁。**  
   修改 `templates/commands/write.md` 和 `templates/commands/write.prompt.md`，把写作执行流程调整为：选择任务 -> 读取 Scene Card / 章节卡 -> 输出约束卡 -> 作者确认 -> beat preview -> 正文块 -> 写后自检和收尾。缺少约束卡时只输出或补充约束卡 preview，不直接写正文。

3. **Scene Card 工作流承认章节卡约束。**  
   修改 `templates/commands/scene.md`，在 `write` 模式要求读取或生成章节卡约束区块，并把无法验证的约束标为待确认。

4. **继续创作入口指向新流程。**  
   修改 `templates/CONTINUE.md` 和 `agent-guides/story-creation-guide.md`，把“写正文前确认章节目标...”升级为“先生成或确认章节前置约束卡”。

5. **测试使用模板文本和生成产物双层锁定。**  
   新增或扩展单元测试：
   - 直接读取源模板，断言章节卡包含硬约束、软约束、当前能力与语言水平、写后自检对照。
   - 扩展 `build-commands` 测试 fixture，断言生成后的 `write` prompt 包含约束卡、作者确认、写后自检对照。

## Risks / Trade-offs

- [章节卡变重] → 第一版只新增文本模板和 prompt 约束，不要求 CLI 自动填充；短章节可以把不适用项写为“无”或“待确认”。
- [agent 编造约束] → prompt 必须要求资料不足时标待确认，不能自动写成正典。
- [生成产物漂移] → 修改 command template 后运行 `npm run build:commands` 和 `npm run check:command-manifest`。

## Migration Plan

新项目和升级后的项目会通过模板获得新版章节卡。旧项目不会被阻断；作者可以从 `.specify/templates/authoring/chapter-card.md` 复制新版模板。命令产物由 build 脚本生成，不手工编辑 `dist/`。
