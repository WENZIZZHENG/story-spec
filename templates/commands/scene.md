---
description: 规划、检查或执行 Scene Card 工作流
argument-hint: [plan | write | review] [章节或场景ID]
allowed-tools: Read(//stories/**/specification.md), Read(stories/**/specification.md), Read(//stories/**/creative-plan.md), Read(stories/**/creative-plan.md), Read(//stories/**/tasks.md), Read(stories/**/tasks.md), Read(//stories/**/scenes/**), Read(stories/**/scenes/**), Read(//spec/graph/*.json), Read(spec/graph/*.json), Read(//spec/world/*.yaml), Read(spec/world/*.yaml), Read(//spec/canon/*.json), Read(spec/canon/*.json), Read(//spec/voice/**), Read(spec/voice/**), Write(//stories/**/scenes/**), Write(stories/**/scenes/**), Write(//stories/**/content/**), Write(stories/**/content/**), Bash(find:*), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: echo ""
  ps: Write-Output ""
---

围绕 Scene Card 推进章节结构、正文写作或场景复核。

用户输入：$ARGUMENTS

## 模式

- `plan`：从 `creative-plan.md`、`tasks.md` 和 Entity Graph 生成或补全 `stories/*/scenes/*.yaml`。
- `write`：按指定 Scene Card 写正文；若没有 Scene Card、章节前置约束卡或缺门禁字段，先输出 Scene Card / 约束卡 preview，不直接写正文。
- `review`：检查 Scene Card 的目标、冲突、结果、情节线、读者承诺、关系变化、世界揭示、情绪节拍、结尾钩子、entity、world/canon 引用和 draftPath。

## 必须读取

- `.specify/memory/constitution.md`
- `stories/*/specification.md`
- `stories/*/creative-plan.md`
- `stories/*/tasks.md`
- `stories/*/scenes/*.yaml`
- `spec/graph/entities.json`
- `spec/graph/edges.json`
- `spec/world/*.yaml`
- `spec/canon/*.json`
- `spec/voice/**`

## 执行要求

1. 先确认目标 story、chapter 和 scene id。
2. 对每张 Scene Card 检查 `pov`、`location`、`time`、`sceneGoal`、`conflict`、`outcome`。
3. 写正文前必须确认 `plotThread`、`readerPromise`、`relationshipChange`、`worldReveal`、`emotionalBeat`、`endingHook`、`successCriteria`；缺任一项时只补卡或输出 preview。
4. 写正文前必须输出章节前置约束卡，覆盖时间点、当前能力与语言水平、情感检查点、硬约束、软约束和写后自检对照，并等待作者确认约束卡。
5. 约束卡资料不足时标为待确认，不得编造角色心理、语言进度、能力数值、关系事实或世界观正典。
6. 写中沉浸原则：约束卡用于写前确认和写后自检，不作为正文生成时逐句审查器；正文阶段优先身体感、感官、动作、当下反应和句子质感。
7. `entities` 必须引用 Entity Graph 中的显式 entity；不能用 AI 推断当作已确认事实。
8. `worldElements` 与 `canonFacts` 只引用已存在或待人工确认的条目。
9. 写正文时只写 `draftPath` 指向的章节，不改其他章节。
10. 涉及对白的 scene 必须读取相关 VoiceFingerprint，检查禁用词、称呼和冲突表达。
11. review 模式只输出问题、依据路径和建议动作，不自动覆盖正文。

## 完成报告

- 处理的 Scene Card。
- 处理或生成的章节前置约束卡。
- 新增或修改的 scene 文件。
- 引用的 entity、WorldFact 和 CanonFact。
- 无法验证或需要人工确认的部分。
