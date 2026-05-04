---
change_type: minor
scope: cli,application,tests
---

# 支持访谈答案中文别名

## CLI 行为

- `storyspec interview/clarify --answers` 支持 `主角=...;第一舞台=...;伙伴=...;能力体系=...` 等中文别名。
- 原有 `questionId=answer` 格式保持兼容。
- 未知别名仍会进入现有错误提示流程，避免静默丢弃。

## 模板契约

- 别名只在 CLI 解析阶段映射到正式 `questionId`。
- 写入记录仍使用稳定字段，不改变澄清记录 schema。

## 生成产物

- 批量答案解析器增加中文别名映射。
- README 补充作者无需记忆 `questionId` 的使用方式。

## 验证

- `npm test -- tests/unit/interview-story.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/interview-alias-cli.test.ts`
