---
change_type: minor
scope: cli,application,agent,docs
---

# 参考作品反向拆解增强

## CLI 行为

`storyspec reference:reverse` 的结构化预览新增 `appealSignals`、`readerPromises`、`repairDirections` 和 `originalizationGuides`。文本输出同步增加“结构吸引力”“读者承诺”“修复方向”“原创化指南”分区，帮助作者区分喜欢点、不可照搬内容和可原创化方向。

## 模板契约

`templates/commands/reference-reverse.prompt.md` 同步要求 agent 输出新增分区。命令仍只处理作者提供的笔记、摘要或本地资料，输出仍是 candidate / preview。

## 生成产物

未手工修改 `dist/`。本次修改了 agent command 模板，需运行 `npm run build:commands` 并检查 command manifest。

## 验证

- `npx openspec validate enhance-reference-reverse-development --strict --json --no-interactive`
- `npx vitest run tests/unit/reverse-reference.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/reference-reverse-cli.test.ts`
- `npm run build:commands`
- `npm run check:command-manifest`
- `npm run check:changes`
- `git diff --check`
