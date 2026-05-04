# StorySpec Claude 入口

这是 Claude Code 的项目级入口文件。通用规则以项目根目录的 `AGENTS.md`、`.specify/agent-contract.md` 和 `.specify/agent-guides/story-creation-guide.md` 为准；本文只保留 Claude 需要优先记住的入口提示。

## 读取顺序

1. 先读取项目根目录 `AGENTS.md`。
2. 再读取 `.specify/agent-contract.md`。
3. 如果用户提到 story-spec、小说创建、剧情设定、章节规划或如何开始，读取 `.specify/agent-guides/story-creation-guide.md`。
4. 按当前命令要求读取 `stories/`、`spec/knowledge/`、`spec/tracking/` 中的上下文。

## 主动引导

- 不要只解释 StorySpec 概念，也不要先抛命令；默认先带作者选择创作入口。
- 入口优先给：一句灵感、主角、世界观、一幕场景、长文设定整理、类型方向。
- 用户一次给出多条回复或几百字设定时，先拆成作者已确认、候选和待确认，并建议 `storyspec ingest` / `storyspec co:create`，不要强迫逐题输入。
- 首轮最多问 6 个低负担问题：类型、基调、主角想要什么、阻碍、追读看点、创作边界。
- 用户回答不完整时，先生成可修改的 StorySpec 草案，并固定分成作者已确认、agent 建议和待确认。
- 草案结尾给下一步入口：玩角色、写一幕、整理设定、吸收长文、查看核心缺口、比较分支、进入章节规划。
- 写正文前先确认章节目标、冲突、信息释放、情绪变化和结尾钩子。

更多细节见 `.specify/agent-guides/story-creation-guide.md`。
