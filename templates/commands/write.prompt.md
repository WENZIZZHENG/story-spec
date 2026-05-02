基于任务清单执行章节写作。

用户输入：$ARGUMENTS

## 前置检查

1. 运行 `{SCRIPT}` 检查当前创作状态。
2. 按 `.specify/agent-contract.md` 与本命令的 `requiredReads` 读取上下文。
3. 从 `stories/*/tasks.md` 选择一个允许写作的任务，并确认任务边界。

## 任务边界

- 只执行状态为 `pending` 或用户明确指定的写作任务。
- 如果任务标记为 `[PLAN-ONLY]`，停止正文写作，先提示补充规划或澄清。
- 如果任务缺少必须读取、允许修改或验收标准，先补齐任务说明，不直接写正文。
- 如果任务涉及高风险内容，只处理剧情功能、人物动机、同意边界、后果和任务标注，不扩写未授权内容。

## 写作流程

1. 将选中任务标记为 `in_progress`。
2. 读取宪法、故事规格、创作计划、任务清单、tracking、World Bible、Canon Ledger、Entity Graph、Scene Cards、VoiceFingerprint 与知识库。
3. 若目标章节存在 Scene Card，优先按 sceneGoal、conflict、outcome、entities、worldElements 和 canonFacts 写作；否则按任务清单写作。
4. 明确本次章节的目标、冲突、人物变化、场景限制和字数要求。
5. 写入 `stories/*/content/**` 中的目标章节文件。
6. 更新相关 `spec/tracking/**`，至少覆盖角色状态、关系变化、剧情进度和时间线。
7. 写完后只生成待确认 canon fact 或 propagation debt；不要自动重写既有正文。
8. 如 scene draftPath 或 graph evidencePaths 发生变化，只更新显式引用和 `spec/graph/indexes.json`，不要用 AI 推断补 graph facts。
9. 涉及角色对白时，先读取相关 `spec/voice/**`，按 VoiceFingerprint 控制句长、称呼、禁用词和冲突表达。
10. 将任务状态更新为 `completed`，记录完成时间、章节路径和字数。

## 写作要求

- 正文必须服从上层规格、创作计划和当前任务。
- 不使用“一、二、三”等数字标题拆分正文段落。
- 场景转换使用空行自然分隔。
- 优先使用具体行动、对话和可见细节表达人物状态，避免解释式总结。
- 字数统计必须按中文字符语境处理，不使用 `wc -w` 作为中文字数依据。

## 完成报告

完成后简要列出：

- 已写入章节路径。
- 实际字数与目标字数。
- 已更新的 tracking 文件。
- 使用的 Scene Card 和 Entity Graph 引用。
- 使用的 VoiceFingerprint 引用。
- 待人工确认的 CanonFact 或 propagation debt。
- 任务状态更新结果。
- 无法完成或无法验证的部分。
