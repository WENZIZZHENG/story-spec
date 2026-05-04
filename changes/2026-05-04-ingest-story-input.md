---
change_type: minor
scope: cli,application,docs,tests
---

# 新增长文创作资料吸收命令

## CLI 行为

- 新增 `storyspec ingest [story] --text <text>` 和 `--file <path>`，可把自然语言长文拆成核心澄清项预览。
- 默认只预览识别结果，不修改 `clarifications.json/md`。
- 新增 `--apply-confirmed`，仅把识别为作者明确字段表达的内容写入 `source: user-explicit`、`confirmed: true` 的澄清记录。

## 模板契约

- 不改变澄清记录 schema 的确认门禁。
- 明确字段进入 confirmed，其他内容保留为候选或待确认提示。

## 生成产物

- 新增长文吸收应用服务和 `ingest` CLI 命令。
- README 和路线图同步记录新入口。

## 验证

- `npm test -- tests/unit/ingest-story-input.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/ingest-cli.test.ts`
