---
change_type: minor
scope: cli,validation,creative-control
---

# 新故事引导与创作导航

## CLI 行为

- 新增 `novel story:new <name>`，创建 `stories/<story>/idea.md`，只记录用户原始创意、待澄清问题和下一步命令，不自动扩写完整设定。
- 新增 `novel next [story]`，根据故事阶段、澄清状态和 AI 候选给出可复制下一步动作。
- `novel validate` 新增澄清门禁：校验 `clarifications.json`，识别 required 未确认、`稍后决定` 等 deferred 回答，以及未确认 AI 建议被写入 specification/tasks/content 的情况。
- 新增 `novel creative:report [story]`，输出用户已确认、需要澄清、AI 建议待确认和可能偏离用户原意的内容。
- `novel interview` 增强访谈体验：跳过已有效确认问题，保留 deferred 回答继续澄清，交互选择增加 `不知道`、`稍后决定`、`给我示例`。
- 新增 `novel preview specify <story>` 与 `novel apply <preview-id>`：预览默认写入 `.specify/previews/`，`apply` 默认 dry-run，只有 `--yes` 且无 blocking 风险时写入正式目标。

## 模板契约

- 不修改 agent command 模板和 prompt compiler 产物。
- 澄清记录仍以 `clarifications.json` / `clarifications.md` 为下游契约。
- `稍后决定`、`不知道`、`给我示例` 记录为用户选择，但不能被下游视为已解决的正典确认。

## 生成产物

- 新增故事创意草稿：`stories/<story>/idea.md`。
- 新增规格预览文件：`.specify/previews/<preview-id>.json`、`.specify/previews/<preview-id>.md`、`.specify/previews/<preview-id>.preview.md`。
- `novel apply <preview-id> --yes` 只在无 blocking 风险时写入 `stories/<story>/specification.md`。

## 验证

- 已运行 `npm test -- --run tests/unit/story-onboarding.test.ts tests/unit/creative-report.test.ts tests/unit/preview-apply.test.ts tests/unit/interview-story.test.ts tests/unit/validate-project.test.ts`。
- 已运行 `npm run build`。
