---
change_type: minor
scope: application,templates,tests
---

# 调整规格文档为故事圣经结构

## CLI 行为

- `preview specify` 生成的 `specification.md` 改为故事圣经结构。
- 规格文档新增“用户已确认”证据区，完整列出用户确认答案。

## 模板契约

- 正式规格按类型与阅读承诺、世界观、社会结构矛盾、能力体系、主角与成长线、核心伙伴、第一舞台、第一卷冲突、长线伏笔、创作边界和待确认组织。
- 正式规格不再依赖核心摘要的截断文本，避免长设定被写成 `...`。

## 生成产物

- `specification.md` 预览产物更接近可长期阅读的故事圣经 v0。
- 作者确认文本完整保留，未确认内容仍标在待确认区。

## 验证

- `npm test -- tests/unit/write-preview.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/specification-bible-cli.test.ts`
