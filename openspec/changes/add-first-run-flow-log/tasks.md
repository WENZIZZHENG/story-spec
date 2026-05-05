# add-first-run-flow-log 任务

## S. 契约与测试

- [x] S1. 写首程流程日志失败测试
  - May edit: `tests/unit/story-onboarding.test.ts`
  - Must not edit: production code、`dist/**`
  - Validation: focused test 先失败，失败原因应指向 `firstRunFlow` 或渲染缺失。

- [x] S2. 定义首程流程日志 DTO
  - May edit: `src/application/story-onboarding.ts`
  - Must not edit: 无关 application 模块、`dist/**`
  - Validation: TypeScript build 识别 `firstRunFlow`、`progressLog` 字段。

## P. 实现

- [x] P1. 实现 `story:new` 的流程日志
  - May edit: `src/application/story-onboarding.ts`
  - Must not edit: idea markdown 写入语义、正典确认规则
  - Validation: `createStoryIdea` 返回当前步骤为 `save-idea`，产物包含 `stories/<story>/idea.md`，下一步指向 `interview`。

- [x] P2. 实现 `next` 的流程日志
  - May edit: `src/application/story-onboarding.ts`
  - Must not edit: action 排序规则、entrypoint 推荐规则
  - Validation: idea 阶段返回当前步骤为 `choose-entrypoint`，推荐下一步命令等于 primary action。

- [x] P3. 渲染人类可读流程日志
  - May edit: `src/application/story-onboarding.ts`
  - Must not edit: verbose/modes 详细内容结构
  - Validation: `renderCreateStoryIdea` 和默认 `renderStoryNext` 包含 `[流程]`、`[产物]`、`[下一步]`，默认输出仍不超过测试约束的一屏范围。

## V. 验证与同步

- [x] V1. 运行首程单元测试
  - Command: `npm test -- tests/unit/story-onboarding.test.ts`
  - Expected: story onboarding tests pass。

- [x] V2. 运行 OpenSpec 验证
  - Command: `npx.cmd openspec validate add-first-run-flow-log`
  - Expected: change artifacts valid。

- [x] V3. 运行文档和变更检查
  - Command: `git diff --check`
  - Expected: no whitespace errors。

- [x] V4. 新增 changeset 并提交
  - May edit: `changes/*.md`
  - Validation: `npm run check:changes` passes 或文档说明无需完整发布记录的原因。
