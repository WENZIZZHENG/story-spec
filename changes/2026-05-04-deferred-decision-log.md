---
change_type: minor
scope: cli,application,docs,tests
---

# 未决项回流与决策日志

## CLI 行为

- `storyspec next` 会把历史 deferred 回答带回前台，并优先给出对应 `storyspec interview --focus <entry>` 命令。
- `storyspec creative:report` 新增“未决项回流与决策日志”，展示当初选择、决策理由、回流条件、继续命令和证据位置。
- `storyspec interview` 的 handoff prompt 会携带未决项回流，提醒 agent 继续追问，而不是把“稍后决定”当成已确认正典。

## 模板契约

- 本批次不修改 slash command 模板。
- deferred 回流仍保持候选状态；只有用户重新确认后的答案才适合进入 specification、creative-plan、World Bible、Scene Card、tracking 或正文。

## 生成产物

- `clarifications.md` 新增“未决项回流与决策日志”区块。
- `creative:report --json` 与 `storyspec next --json` 的结果新增 `decisionLog` 字段，包含 `deferredItems`、确认数量和待确认 AI 建议数量。

## 验证

- `npm run build`
- `npx vitest run tests/unit/story-onboarding.test.ts tests/unit/creative-report.test.ts tests/unit/interview-story.test.ts tests/unit/manage-clarifications.test.ts`
- `npm test`
- `npm run test:smoke`
- `npm run check:changes`
- `npm run check:command-manifest`
