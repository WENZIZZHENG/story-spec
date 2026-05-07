## 设计目标

把反向拆解从“风险与候选列表”推进到“可用于原创开发的预览卡”。增强后的输出要能回答三件事：

1. 作者喜欢参考作品的哪些结构吸引力。
2. 哪些专名、剧情和续写意图不能迁移。
3. 如何把吸引力转成新故事的读者承诺、修复方向和原创化设计。

## 数据结构

在现有 `ReferenceReverseResult` 上新增四类 preview-only 字段：

- `appealSignals`：作者明确喜欢或被吸引的结构信号，包含 `label/evidence/reason`。
- `readerPromises`：可转译到原创项目的读者承诺，包含 `label/promise/sourceReason`。
- `repairDirections`：针对不适点、断更、崩坏或未兑现承诺的原创修复方向，包含 `label/direction/avoid/sourceReason`。
- `originalizationGuides`：从结构到原创设计的转译指南，包含 `sourceStructure/originalMove/boundary`。

这些字段只来自作者提供的摘要、读后笔记或本地文件。它们不是正典，也不会写入 story、world、canon、tracking 或正文。

## 输出层级

文本渲染按下列顺序呈现：

1. 元信息和写入状态。
2. 结构吸引力。
3. 原作依赖项。
4. 高风险相似项。
5. 可原创化结构。
6. 读者承诺。
7. 修复方向。
8. 原创化指南。
9. 新故事候选。
10. 不得直接照搬。

JSON 输出自然包含新增字段，方便后续 App 或 agent 读取。

## 边界

- 源文件仍是 `src/application/reverse-reference.ts`；CLI 只复用应用层结果，不新增命令参数。
- 不手工编辑 `dist/`。
- 不引入外部依赖或模型调用。
- 不绕过 preview / confirm / apply。增强字段即使质量较高，也只能作为 candidate/preview 进入后续讨论。

## 测试策略

- 先扩展 `tests/unit/reverse-reference.test.ts`，断言新增字段和文本分区存在，并确认仍不写入正式文件。
- 必要时扩展 `tests/smoke/reference-reverse-cli.test.ts`，确认 JSON 输出包含新增字段、文本输出包含新增分区。
- 运行 OpenSpec validate、相关 unit/smoke、build、changeset 检查和 diff check。
