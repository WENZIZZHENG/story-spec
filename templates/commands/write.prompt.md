基于任务清单执行章节写作。

用户输入：$ARGUMENTS

## 前置检查

1. 运行 `{SCRIPT}` 检查当前创作状态。
2. 按 `.specify/agent-contract.md` 与本命令的 `requiredReads` 读取上下文；如果存在 `.specify/memory/author-profile.json`，只把它作为作者偏好上下文，不作为故事正典。
3. 从 `stories/*/tasks.md` 选择一个允许写作的任务，并确认任务边界。

## 任务边界

- 只执行状态为 `pending` 或用户明确指定的写作任务。
- 如果任务标记为 `[PLAN-ONLY]`，停止正文写作，先提示补充规划或澄清。
- 如果任务缺少必须读取、允许修改或验收标准，先补齐任务说明，不直接写正文。
- 如果任务涉及高风险内容，只处理剧情功能、人物动机、同意边界、后果和任务标注，不扩写未授权内容。
- 写正文前必须找到目标章节或目标 scene 的 Scene Card；没有 Scene Card 时先输出 Scene Card preview，不直接写正文。
- Scene Card 必须具备 `plotThread`、`readerPromise`、`relationshipChange`、`worldReveal`、`emotionalBeat`、`endingHook`、`successCriteria`；缺任一项时先补卡并等待作者确认。
- 写章前先输出章节前置约束卡，覆盖时间点、当前能力与语言水平、情感检查点、硬约束、软约束和写后自检对照；等待作者确认约束卡或改写后再进入 beat 预览和正文。
- 章节前置约束卡资料不足时标为待确认，不得编造角色心理、语言进度、能力数值、关系事实或世界观正典。
- 约束卡确认后再输出 3-6 条 scene beat 或等价方向预览，beat 只是方向预览，不是已完成正文。
- 资料不足时，先列出缺失上下文，不得编造正典事实。
- 写作必须经过 preview / confirm / apply，不得跳过预览直接修改正文，也不得修改未授权文件。

## 阶段性反馈契约

- 阶段 0 - 章节前置约束卡：先输出约束卡并等待作者确认；JSON stage 字段仍使用 plan。
- 阶段 1 - beat 预览：约束卡确认后输出 3-6 条 scene beat，说明目标、冲突、人物变化、场景限制、风险和缺口；JSON stage 字段只能使用 plan、write、finish，此阶段为 plan。
- 阶段 2 - 正文块：正文按 scene、自然段组或目标字数分块输出，每块说明已完成的剧情功能和下一块目标；JSON stage 字段为 write。
- 阶段 3 - 收尾验证：正文结束后输出正文路径、字数、建议或已执行验证、tracking 待更新/待确认、写后自检对照和 next action；JSON stage 字段为 finish。

## 写作流程

1. 将选中任务标记为 `in_progress`。
2. 读取宪法、作者画像（如有）、故事规格、创作计划、任务清单、tracking、World Bible、Canon Ledger、Entity Graph、Scene Cards、VoiceFingerprint 与知识库。
3. 先按 Scene Card 确认 sceneGoal、conflict、outcome、plotThread、readerPromise、relationshipChange、worldReveal、emotionalBeat、endingHook、successCriteria；未通过时停止正文写作。
4. 先输出章节前置约束卡，确认本章时间点、当前能力与语言水平、情感检查点、硬约束、软约束和写后自检对照，并等待作者确认约束卡。
5. 约束卡确认后输出 3-6 条 scene beat 或等价方向预览，确认本次章节的目标、冲突、人物变化、场景限制和字数要求。
6. 正文按分块推进，长章节必须拆成多个阶段块输出，不要一次性混写成无法扫描的大段。
7. 写入 `stories/*/content/**` 中的目标章节文件。
8. 更新相关 `spec/tracking/**`，至少覆盖角色状态、关系变化、剧情进度和时间线。
9. 写完后只生成待确认 canon fact 或 propagation debt；不要自动重写既有正文。
10. 如 scene draftPath 或 graph evidencePaths 发生变化，只更新显式引用和 `spec/graph/indexes.json`，不要用 AI 推断补 graph facts。
11. 涉及角色对白时，先读取相关 `spec/voice/**`，按 VoiceFingerprint 控制句长、称呼、禁用词和冲突表达。
12. 收尾时单独给出摘要，必须包含正文路径、建议或已执行验证、tracking 待更新/待确认、写后自检对照、next action。
13. 将任务状态更新为 `completed`，记录完成时间、章节路径和字数。

## 写作要求

- 正文必须服从上层规格、创作计划和当前任务。
- 作者画像只影响推荐和风味参考；如果与当前故事明确回答冲突，优先服从当前故事。
- 不使用“一、二、三”等数字标题拆分正文段落。
- 场景转换使用空行自然分隔。
- 优先使用具体行动、对话和可见细节表达人物状态，避免解释式总结。
- 字数统计必须按中文字符语境处理，不使用 `wc -w` 作为中文字数依据。
- 收尾摘要必须包含正文路径、建议或已执行验证、tracking 待更新/待确认、写后自检对照、next action。

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
