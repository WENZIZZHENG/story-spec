# 小说创建引导协议

这是面向用户和维护者的说明版。真正会安装到 StorySpec 小说项目中的 agent 事实源位于：

```text
.specify/agent-guides/story-creation-guide.md
```

仓库源文件位于：

```text
agent-guides/story-creation-guide.md
```

## 解决什么问题

当用户问“story-spec 适不适合写小说”或“我要怎么使用”时，agent 不应只解释概念或先抛命令。它应该先把作者带进故事入口：从一句灵感、主角、世界观、一幕场景或类型方向开始，再进入少量问题、可修改草案、章节前置和写作后回填。

## 跨工具入口

StorySpec 会为不同 agent 提供入口文件，入口只保留触发规则和读取顺序，详细流程统一指向 `.specify/agent-guides/story-creation-guide.md`。

| 工具 | 入口 |
| --- | --- |
| Codex | `AGENTS.md` |
| Claude | `CLAUDE.md` |
| Gemini | `.gemini/GEMINI.md` |
| Cursor | `.cursor/rules/story-spec.mdc` |
| Continue | `.continue/rules/story-spec.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| 通用 Markdown agent | `.specify/agent-guides/story-creation-guide.md` |

## 行为要点

- 触发 story-spec、小说创建、剧情设定、章节规划或“怎么开始”时，主动引导，不只解释。
- 默认先给创作入口选择：一句灵感、主角、世界观、一幕场景、类型方向。
- 如果作者一次给出多条回复或几百字设定，先拆成作者已确认、候选和待确认，并建议使用 `storyspec ingest` / `storyspec co:create`，不要强迫逐题输入。
- 首轮最多问 6 个低负担问题：类型、基调、主角想要什么、阻碍、追读看点、创作边界。
- 生成 StorySpec 草案时固定区分作者已确认、agent 建议和待确认。
- 草案结尾给下一步入口：玩角色、写一幕、整理设定、吸收长文、查看核心缺口、比较分支、进入章节规划。
- 写正文前先生成或确认章节前置约束卡，至少覆盖时间点、当前能力与语言水平、情感检查点、硬约束、软约束和写后自检对照；作者确认后先写 scene beat，再写章节小样预览，最后才进入完整正文。
- 章节小样是 800-1500 字左右的精简预览稿，像缩略正文而不是纯大纲；小样默认不写入正式正文、不更新 tracking、不进入 canon，只有作者确认或改写小样后才扩写完整章节。
- 约束卡用于写前确认和写后自检，不作为正文生成时逐句审查器；正文阶段优先身体感、感官、动作、当下反应和句子质感。
- 写作或修订后回填人物状态、时间线、伏笔和正典事实。
