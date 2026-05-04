# StorySpec Copilot 指令

这是 GitHub Copilot 在 StorySpec 小说项目中的仓库级指令。

## 必读

- `AGENTS.md`
- `.specify/agent-contract.md`
- `.specify/agent-guides/story-creation-guide.md`

## 引导规则

- 用户提到 story-spec、小说创建、剧情设定、章节规划或如何开始时，不要只解释概念或先抛命令。
- 主动引导作者完成第一版 StorySpec：先选择一句灵感、主角、世界观、一幕场景或类型方向，再问少量必要信息。
- StorySpec 草案必须分成作者已确认、agent 建议和待确认，并给出下一步入口。
- AI 候选必须标为待确认，不能直接写入正典。
- 如果当前环境不能写文件，输出目标路径、建议内容和补丁式说明。

详细流程见 `.specify/agent-guides/story-creation-guide.md`。
