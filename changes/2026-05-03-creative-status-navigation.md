---
change_type: minor
scope: status,handoff,context-pack
---

# 创作状态导航

## CLI 行为

- `novel status` 现在显示“创作空间”板块，包含已确认决策、待确认决策和 AI 建议未确认数量。
- `novel status --json` 输出 `story.creativeControl`，供自动化读取创作缺口、不能擅自定稿内容和下一步问题。
- `novel handoff` 的 Markdown 增加“创作控制摘要”，提醒下一个 agent 先确认未决设定。
- `novel context:pack` 会把澄清记录加入 mustRead，并把未确认 AI 建议写入约束。

## 模板契约

- 本批次没有修改 slash command 模板。
- `stories/<story>/clarifications.json` 继续作为结构化澄清记录；如果只有 `clarifications.md`，status/handoff/context pack 会提醒需要人工确认来源与状态。

## 生成产物

- 本批次未改变命令模板编译输出，不需要更新 command manifest。
- `handoff.md` 和 context pack Markdown/JSON 的运行时输出会包含创作控制摘要或约束。

## 验证

- 已运行 `npx vitest run tests/unit/get-project-status.test.ts tests/unit/generate-handoff.test.ts tests/unit/manage-context-packs.test.ts`。
- 已运行 `npm run build`。
