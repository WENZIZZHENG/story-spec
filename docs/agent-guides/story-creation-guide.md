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

当用户问“story-spec 适不适合写小说”或“我要怎么使用”时，agent 不应只解释概念。它应该主动把用户带入第一轮创建：少量问题、可修改草案、章节前置、写作后回填。

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
- 首轮最多问 6 个低负担问题：类型、基调、主角、目标、阻碍、读者感受。
- 生成 StorySpec 草案时区分作者已确认、agent 建议和待确认。
- 写正文前先确认章节目标、冲突、信息释放、情绪变化和结尾钩子。
- 写作或修订后回填人物状态、时间线、伏笔和正典事实。
