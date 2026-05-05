---
change_type: minor
scope: templates,commands,docs,tests,openspec,todo
---

# 章节前置约束卡

## CLI 行为

- 不新增 `storyspec chapter:preflight` CLI。
- `/write` 和 Scene Card 的 agent prompt 流程会在正文前先产出章节前置约束卡，并要求等待作者确认后再写作。
- 资料不足时只能标为待确认，不把 agent 推断写入 canon、tracking 或正文。

## 模板契约

- 章节卡模板新增“时间点”“本章约束卡”“当前能力与语言水平”“本章情感检查点”“硬约束”“软约束”和“写后自检对照”区块。
- `/write` 与 Scene Card 工作流要求正文前先输出章节前置约束卡，等待作者确认后再进入 scene beat 和正文。
- `CONTINUE.md` 与 agent 故事创建指南同步写前约束卡流程，提醒资料不足时标为待确认，不把 agent 推断写入正典。

## 生成产物

- `npm run build:commands` 会把章节前置约束卡流程同步到各 agent command 产物。
- 命令产物 manifest 已随模板变更更新。
- README 不承诺尚未实现的独立章节前置 CLI。

## 验证

- `openspec validate add-chapter-preflight-constraint-card --strict --json --no-interactive`
- `npx vitest run tests/unit/authoring-templates.test.ts tests/unit/build-commands.test.ts`
- `npm run build`
- `npm run build:commands`
- `npm run check:command-manifest`
- `npm run check:changes`
- `git diff --check`

## 边界

- 本批不新增 `storyspec chapter:preflight` CLI。
- 不自动推断角色心理、语言学习进度、能力数值或世界观事实。
- 未确认约束只能作为待确认内容，不进入 canon、tracking 或正文。
