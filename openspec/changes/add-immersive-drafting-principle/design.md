## Context

`add-chapter-preflight-constraint-card` 已让章节卡和写作 prompt 固定输出“章节前置约束卡 -> 作者确认 -> beat preview -> 正文 -> 写后自检”。这解决了下限问题，但没有说明约束卡不应该在正文句子生成时逐条压住叙事。

本次用户提出的原则是：约束卡拦住的是下限，但不保证上限。写句子时只想一件事：这句话有没有让读者感觉到角色身体正在经历什么。自检应在写完一章之后再做。

## Goals / Non-Goals

**Goals:**

- 明确三阶段姿态：写前确认约束、写中沉浸起草、写后对照自检。
- 保留约束卡确认门禁和硬约束自检。
- 让 agent prompt 在正文阶段优先提示身体感、感官、动作、当下反应和句子质感。

**Non-Goals:**

- 不取消章节前置约束卡。
- 不新增 `storyspec chapter:preflight` CLI。
- 不自动评价文学上限或给正文打分。
- 不降低未确认事实的 candidate / confirm / apply 边界。

## Design

1. **章节卡模板说明使用时机。**
   - 更新 `templates/authoring/chapter-card.md` 开头说明。
   - 在约束卡附近增加“写中沉浸原则”说明：约束卡用于写前确认和写后自检，不作为正文生成时逐句审查器。

2. **写作 prompt 固定三阶段。**
   - 更新 `templates/commands/write.md` 和 `templates/commands/write.prompt.md` 的任务边界、阶段契约和写作流程。
   - 阶段 0：输出约束卡并等待确认。
   - 阶段 1：beat 预览。
   - 阶段 2：正文块，提示写中沉浸起草。
   - 阶段 3：写后对照自检。

3. **Scene Card 和继续写作入口同步。**
   - `templates/commands/scene.md` 的 write 模式同步“写中沉浸，写后自检”。
   - `templates/CONTINUE.md`、`agent-guides/story-creation-guide.md` 和 `docs/agent-guides/story-creation-guide.md` 同步同一原则。

4. **测试锁定源模板和生成产物。**
   - `tests/unit/authoring-templates.test.ts` 直接断言章节卡包含写中沉浸原则。
   - `tests/unit/build-commands.test.ts` 断言 Codex、Gemini、Generic 生成的 write prompt 包含写中沉浸和约束后置自检文案。

## Risks / Trade-offs

- [误解成取消约束] -> 文案必须同时出现写前确认和写后自检。
- [prompt 变长] -> 只加关键姿态句，不扩展文学理论。
- [生成产物漂移] -> 修改 command template 后运行 `npm run build:commands` 和 manifest 检查。

## Migration Plan

新项目和升级后的项目通过模板获得新文案。旧项目可以从 `.specify/templates/authoring/chapter-card.md` 和 agent prompt 复制新版说明。命令产物由 build 脚本生成，不手工编辑 `dist/`。
