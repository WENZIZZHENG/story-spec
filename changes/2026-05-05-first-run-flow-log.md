---
change_type: minor
scope: cli,onboarding,openspec,tests
---

# 增加首程流程日志

## CLI 行为

- `storyspec story:new` 的应用层结果新增 `firstRunFlow`，记录首程总步骤、当前步骤、推荐下一步和进度日志。
- `storyspec next` 的应用层结果新增 `firstRunFlow`，让 agent/UI 能直接读取当前步骤、推荐命令和产物路径。
- 人类输出增加低噪声 `[流程]`、`[产物]`、`[下一步]` 和 `[边界]` 行，帮助作者知道自己处于首程哪一步。

## 模板契约

- 不修改 agent command 模板，不改变 preview / confirm / apply 边界。
- 流程日志只描述阶段、产物和下一步，不自动确认候选内容，也不引导低信息量故事直接写正文。

## 生成产物

- 不修改 `templates/commands/**`，不需要同步命令 manifest。
- 不手工编辑 `dist/**`。

## 验证

- `npm run build`
- `npx vitest run tests/unit/story-onboarding.test.ts`
- `npx openspec validate add-first-run-flow-log --strict`
- `git diff --check`
- `npm run check:changes`
