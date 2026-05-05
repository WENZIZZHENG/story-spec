# 章节写中沉浸体验路线图

## 状态

Active。本文登记“写中沉浸原则与约束后置自检”的实现待办。实现前应按影响范围转为 OpenSpec change；本文不替代 OpenSpec artifacts。

## 背景和目标

章节前置约束卡已经能保护人物情绪顺序、能力边界、语言水平、权力关系和世界观一致性。但当前 `/write`、`write.prompt.md`、章节卡和 agent guide 的表述容易让 agent 在正文生成时逐条审查约束卡，导致章节像合规说明书，而不是让读者感到角色身体正在经历当下。

目标是把章节写作流程明确分成：

1. 写前确认约束：确认事实边界和不能写错的下限。
2. 写中沉浸起草：写句子时优先追求身体感、感官、动作、当下反应和句子质感。
3. 写后对照自检：正文完成后再用约束卡检查硬约束。

## 非目标

- 不取消章节前置约束卡。
- 不降低作者确认门禁。
- 不让未确认约束进入正典、tracking 或正文。
- 不新增 `storyspec chapter:preflight` 或其他 CLI。
- 不引入 LLM 评分、外部写作审查工具或自动评价文学上限。

## P0 立即处理

### P0-1 写中沉浸原则与约束后置自检

- 类型：章节写作体验、agent prompt、模板文案。
- 背景/问题：章节前置约束卡能拦住下限，但不保证上限。若 agent 写正文时一直背约束卡，容易牺牲角色身体感、现场反应和句子质感。
- 已有基础：`templates/authoring/chapter-card.md` 已包含本章约束卡和写后自检对照；`templates/commands/write.md`、`templates/commands/write.prompt.md`、`templates/commands/scene.md`、`templates/CONTINUE.md` 和 agent guide 已要求写前输出约束卡、作者确认、写后对照。
- 缺口：缺少明确的“写中沉浸原则”：约束卡用于写前确认事实边界和写后自检，不作为正文生成时逐句审查器；正文写作阶段优先让读者感到角色身体正在经历当下。
- 建议方案：在后续 OpenSpec 中把现有章节前置流程调整为“写前确认约束 -> 写中沉浸起草 -> 写后对照自检”。只改模板、agent guide 和 command prompt；在 `/write` 文案中明确“写句子时先追求身体感、感官、动作和当下反应，完成正文后再用约束卡检查硬约束”。
- 涉及文件/模块：`templates/commands/write.md`、`templates/commands/write.prompt.md`、`templates/commands/scene.md`、`templates/authoring/chapter-card.md`、`templates/CONTINUE.md`、`agent-guides/story-creation-guide.md`、`docs/agent-guides/story-creation-guide.md`、`tests/unit/build-commands.test.ts`、`tests/unit/authoring-templates.test.ts`。
- 参考项目/资料：`openspec/changes/add-chapter-preflight-constraint-card/`；`docs/tech/archive/completed-roadmaps/chapter-maintenance-automation-roadmap.md` 的 P1-0；本次讨论中的原则：“约束卡拦住的是下限，但不保证上限；写中只关注这句话是否让读者感觉到晏无的身体在经历什么。”
- OpenSpec 输入：新建 OpenSpec change `add-immersive-drafting-principle`。proposal 必须写清它不是取消约束卡，而是调整约束卡的使用时机；design 需列出三阶段流程、prompt 文案边界和写后自检输出；tasks 至少包含模板更新、prompt 生成产物测试、文档同步、changeset 和待办状态更新。
- 验收标准：agent 在写正文前仍输出并确认约束卡；正文生成阶段提示转向身体感、现场感和质感优先；写后收尾仍对照硬约束自检；README 或用户文档不承诺独立 CLI。
- 验收命令：`npm run build:commands`、`npm run check:command-manifest`、相关 `build-commands` / authoring template 单测、`npm run check:changes`、`git diff --check`。
- 不做/边界：不降低作者确认门禁，不让未确认约束进入正典，不要求自动评价文学上限，不引入 LLM 评分或外部写作审查工具。

## 完成同步

- 实现前先转 OpenSpec change。
- 若修改命令模板，运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 若修改 CLI 行为、模板契约、生成产物或用户可见文档，新增 changeset。
- 完成后更新本文状态，追加 [todo-archive.md](todo-archive.md) 归档条目，并从 [todo-index.md](todo-index.md) 移除活跃路线。
