---
change_type: minor
scope: cli,application,tests
---

# 无标题长文候选识别

## CLI 行为

- `storyspec ingest` 现在会把无标题自然段按关键词归入候选分组，例如主角、第一舞台、能力体系和创作边界。
- 这些候选使用较低置信度，只出现在 `candidateItems`。
- 即使传入 `--apply-confirmed`，无标题候选也不会自动写入 `clarifications.json`。

## 模板契约

- 明确字段标签仍按原逻辑进入 confirmed 写入预览。
- 无标题自然段只作为候选提示，继续保持作者确认门禁。

## 生成产物

- `ingest` JSON 输出中的 `candidateItems` 会包含无标题长文识别结果。
- 文本输出的“保留候选”区会展示候选来源和置信度说明。

## 验证

- `npm test -- tests/unit/ingest-story-input.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/ingest-cli.test.ts`
