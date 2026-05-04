# 创作控制权指南

StorySpec 的目标不是用一句话替作者定完整世界观，而是把模糊创意变成可追踪、可确认、可回放的创作决策。你可以少说一点开始，但系统会把未确认内容留在澄清记录里，而不是静默写成正典。

## 三种来源

| 来源 | 含义 | 能否进入正典 |
| --- | --- | --- |
| `user-explicit` | 用户明确输入、选择或改写后的答案 | 可以，仍建议在写入前预览 |
| `imported` | 从旧资料或人工整理导入的答案 | 可以，但迁移时要人工复核 |
| `ai-suggested` | AI 为了帮助思考提出的建议、默认值或推断 | 不可以，必须先由用户确认 |

`confirmed: false` 的内容只能作为候选。required 问题未回答时，`/specify`、`/plan`、`/tasks` 和 `/write` 都应继续标记为 `[需要澄清]`。

## 推荐流程

```text
一句话灵感 -> storyspec story:new -> storyspec next -> storyspec interview -> storyspec creative:report -> storyspec preview specify -> storyspec apply -> /storyspec-plan -> /storyspec-tasks -> /storyspec-write -> storyspec review
```

终端侧：

```bash
storyspec init my-novel --agent codex
cd my-novel
storyspec story:new idea-demo --idea "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。"
storyspec next idea-demo
storyspec interview idea-demo --premise "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁" --max-questions 6
storyspec creative:report idea-demo
storyspec preview specify idea-demo
storyspec status
```

`storyspec interview` 会生成：

- `stories/idea-demo/clarifications.json`：结构化问题、答案、来源和确认状态。
- `stories/idea-demo/clarifications.md`：给作者审阅的 Markdown 记录。
- 可复制到 agent 的 `/storyspec-specify ...` handoff prompt。

## 示例分叉

当你还不确定方向，可以让系统先给示例分叉。示例不是正典，只有你选择或改写确认后才会进入 `user-explicit`。

### 示例 1：作者主导，继续提问

```text
我只确认题材组合：异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。
主角身份、感情对象和威胁真相都先不要定死，请继续问我 5 个关键问题。
```

适合：你想保留最大创作空间，先用问题打开方向。

### 示例 2：规则优先，轻松冒险

```text
主角是后端程序员，把法术当运行时调试。
第一卷先在边境小城解决小事故；文明级威胁只通过日志异常和旧设施失控露出。
感情线先是任务搭档，第一卷只到互相信任。
```

适合：你已经确定编程施法的阅读趣味，但不想过早压重主线。

### 示例 3：文明差异优先

```text
编程施法不是爽点外挂，而是主角理解异界制度漏洞的工具。
建设和思想改造只服务于冒险问题，不把故事写成纯种田。
感情线承担文明差异冲突，让改变世界先从理解一个人开始。
```

适合：你更关注思想碰撞和长期威胁，希望慢热推进。

## Replay 和修改答案

再次运行 `storyspec interview` 或 `storyspec clarify` 会读取旧 `clarifications.json`：

```bash
storyspec clarify idea-demo --answers "core.premise=编程施法是工具，开局仍然是轻松冒险。"
```

没有传 `--premise` 时，CLI 会复用旧记录里的 premise。只会更新本轮明确给出的答案，旧答案继续保留。

非交互环境可以用：

```bash
storyspec interview idea-demo \
  --premise "异界穿越、编程施法、慢热感情" \
  --answers "core.scope=主角身份和威胁真相先不要定死。" \
  --json
```

## 写入前预览

`/storyspec-specify`、`/storyspec-constitution`、`/storyspec-plan` 和 `/storyspec-tasks` 都应先输出 preview。预览必须说明：

- 拟写入的文件。
- 用户已明确的答案。
- AI 建议但未确认的内容。
- required 未答问题。
- 可能影响的后续文件。

只有你明确“确认写入”或使用 apply/confirm 语义后，agent 才应落盘。

## 漂移检测

运行：

```bash
storyspec review --json
```

如果规格、计划、任务、scene 或正文使用了未确认 AI 建议，review 会输出：

- `CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION`
- `CREATIVE_INTENT_DRIFT_PENDING_TOPIC`

这些 finding 会进入 continuity reviewer，并生成任务草稿。处理方式是先确认或改回候选，不自动重写正文。

## 旧项目迁移

旧项目没有澄清记录时，可以手动新建：

```bash
storyspec interview 001-story --premise "旧项目的一句话核心创意" --max-questions 6
```

迁移时建议：

- 把作者明确确认过的设定写成 `user-explicit`。
- 把 AI 推断、默认值、旧 prompt 自动补完的设定标成 `ai-suggested` 且 `confirmed: false`。
- 对主角身份、感情对象、威胁真相、力量体系、结局和高影响世界规则保守处理，先放回 `[需要澄清]`。
- 运行 `storyspec status` 查看待确认决策，再运行 `storyspec review --json` 检查是否已有漂移。

## 常见误区

- 不要把示例分叉当标准答案；它只是帮助你更容易选择。
- 不要因为 `clarifications.md` 里出现某个想法，就默认它已经是正典；以 `clarifications.json` 的 `source` 和 `confirmed` 为准。
- 不要让任务直接写未确认方向的正文；这类任务应标 `[PLAN-ONLY]`，先做澄清或复核。
