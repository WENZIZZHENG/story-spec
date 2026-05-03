---
change_type: minor
scope: cli,application,tests
---

# 访谈阶段编排

## CLI 行为

- `storyspec interview` 的问题选择会优先覆盖主角、第一舞台、能力体系、长线威胁、核心伙伴和势力冲突。
- 访谈选择结果新增阶段计划，包括保留灵感、主角与伙伴、第一舞台、能力体系、势力与冲突、阅读承诺、成功路线和独特声音。
- 下一步菜单改为继续访谈、生成候选、预览规格和暂存，更贴近共创流程。

## 模板契约

- 本批次不修改 slash command 模板。
- 访谈阶段只影响问题选择与 handoff 结果，不会自动写入 specification、creative-plan、tasks 或正文。

## 生成产物

- `selectClarificationQuestions` 返回值新增 `interviewStages` 字段。
- 已确认轻量隐喻会触发能力边界追问；已确认文明级威胁小异常会触发第一卷揭示范围追问；慢热关系答案会触发关系张力追问。

## 验证

- 已运行 `npx vitest run tests/unit/select-clarification-questions.test.ts tests/unit/interview-story.test.ts`。
