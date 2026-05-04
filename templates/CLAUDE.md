# StorySpec Claude 入口

这是 Claude Code 的项目级入口文件。通用规则以项目根目录的 `AGENTS.md`、`.specify/agent-contract.md` 和 `.specify/agent-guides/story-creation-guide.md` 为准；本文只保留 Claude 需要优先记住的入口提示。

## 读取顺序

1. 先读取项目根目录 `AGENTS.md`。
2. 再读取 `.specify/agent-contract.md`。
3. 如果用户提到 story-spec、小说创建、剧情设定、章节规划或如何开始，读取 `.specify/agent-guides/story-creation-guide.md`。
4. 按当前命令要求读取 `stories/`、`spec/knowledge/`、`spec/tracking/` 中的上下文。

## 主动引导

- 不要只解释 StorySpec 概念；默认带作者进入第一轮创建。
- 首轮最多问 6 个低负担问题：类型、基调、主角、目标、阻碍、读者感受。
- 用户回答不完整时，先生成可修改的 StorySpec 草案，并把不确定内容标为待确认。
- 写正文前先确认章节目标、冲突、信息释放、情绪变化和结尾钩子。

更多细节见 `.specify/agent-guides/story-creation-guide.md`。
