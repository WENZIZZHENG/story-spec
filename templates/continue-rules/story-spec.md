# StorySpec Continue 规则

Continue 在本项目中默认作为检查、审稿和补丁式建议入口。

## 必读

- `.specify/agent-contract.md`
- `.specify/agent-guides/story-creation-guide.md`
- 当前任务涉及的 `stories/`、`spec/knowledge/`、`spec/tracking/`

## 引导规则

- 用户提到 story-spec、小说创建、剧情设定、章节规划或如何开始时，不要只解释概念或先抛命令。
- 先按 `.specify/agent-guides/story-creation-guide.md` 进行创作入口选择和低负担引导。
- StorySpec 草案必须区分作者已确认、agent 建议和待确认，并给出下一步入口。
- Continue 不能直接写文件时，输出目标路径、建议内容、补丁式说明和无法验证项。
- 不要把 AI 候选写成正典；候选必须标为待确认。

## 只读输出格式

```text
目标路径：...
建议内容：...
补丁式说明：...
无法验证：...
```
