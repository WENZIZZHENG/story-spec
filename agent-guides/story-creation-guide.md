# StorySpec 小说创建引导协议

本文是 StorySpec 项目的跨 agent 引导协议。Codex、Claude、Gemini、Cursor、Continue、Copilot 和通用 Markdown agent 都应优先遵循本文，再按自身命令能力降级执行。

## 触发条件

用户提到以下任一意图时，进入本协议：

- `story-spec`、`StorySpec`、小说项目、创建小说、剧情设定、章节规划、写作规格。
- 询问“适不适合”“怎么用”“怎么开始”“帮我写小说”。
- 只给出题材、风格、主角、世界观碎片或一句话灵感。

不要只解释概念。默认目标是把用户带到第一版可执行的 StorySpec 状态。

## 默认响应

先给结论，然后主动提供下一步：

```text
适合。我们可以现在创建第一版 StorySpec：先用 6 个低负担问题确认方向，再生成故事规格草案。
```

如果用户只是问工具是否适合，也要补一句：

```text
如果你愿意，我可以直接带你完成第一轮创建。
```

## 低负担启动问题

首次引导最多问 6 个问题。用户回答不完整也继续推进，不追问到表格填满。

```text
1. 小说类型：例如玄幻、科幻、都市、悬疑、言情、历史、赛博朋克
2. 故事基调：爽文、压抑、温暖、黑暗、史诗、轻松、荒诞
3. 主角是谁：一句话描述即可
4. 主角想要什么：
5. 最大阻碍是什么：
6. 你希望读者读完后的感觉：
```

如果用户已经给出部分信息，只问缺失的 1 到 3 项。不要重复索要已提供内容。

## 生成第一版 StorySpec

拿到足够信息后，输出“第一版 StorySpec 草案”。它应能指导下一步创作，但不要提前锁死全部设定。

必须包含：

- 作品定位：类型、基调、读者感受、创作边界。
- 一句话故事：主角目标、阻碍、代价。
- 主角核心：表面目标、深层欲望、缺陷、不能违背的性格原则。
- 关键冲突：外部阻力、内在矛盾、关系张力。
- 世界/规则：只写已确认或高度必要的规则。
- 主线方向：开端、第一转折、中段压力、高潮方向、结局倾向。
- 文风约束：叙事视角、语言密度、节奏偏好、避免写法。
- 待确认问题：列出仍需作者决定的内容。

必须区分：

- 作者已确认。
- agent 建议。
- 待确认。

## 推荐文件落点

如果当前 agent 可以写文件，按项目状态选择落点：

- 尚未创建故事：先建议运行 `storyspec story:new <故事名> --idea "<原始灵感>"`。
- 已有故事但无规格：优先生成 `stories/<story>/specification.md` 的 preview 或建议运行 `storyspec preview specify <story>`。
- 还在探索：把内容作为候选留在对话或 `stories/<story>/clarifications.md`，不要写入正典。

如果当前 agent 不能写文件，输出补丁式建议：

```text
目标路径：stories/<story>/specification.md
建议内容：...
无法自动写入：当前 agent 为只读模式
```

## 章节前置

在写正文前，先生成或确认当前章节的 `chapter-spec` / Scene Card。

至少确认：

- 本章目标。
- 本章冲突。
- 登场人物。
- 信息释放。
- 情绪变化。
- 结尾钩子。
- 不允许越过的设定边界。

没有这些内容时，不直接写完整章节；先输出章节预览或提 1 到 3 个关键问题。

## 写作后回填

完成一章、一个场景或一次大修后，提醒或执行以下回填：

- 人物状态：关系、伤势、秘密、心理变化。
- 时间线：本章发生的顺序和时间跨度。
- 伏笔清单：新增、推进、回收、废弃。
- 正典事实：只记录作者确认或正文已经发生的内容。
- 任务状态：只更新当前完成项。

## 禁止行为

- 不要把 `story-spec` 当成一次性大纲生成器。
- 不要在用户只给一句灵感时直接生成完整世界观、人物小传和几十章大纲。
- 不要把 AI 候选写成正典事实。
- 不要跳过 preview / confirm / apply 或等价确认流程。
- 不要用大量问题阻塞用户开始创作。

## 工具降级

- Codex：优先读 `AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Claude：优先读 `CLAUDE.md`、`AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Gemini：优先读 `.gemini/GEMINI.md`、`AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Cursor：优先读 `.cursor/rules/story-spec.mdc`、`AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Continue：优先读 `.continue/rules/story-spec.md` 和 `.continue/prompts/*.md`；只读模式下输出补丁式建议。
- Copilot：优先读 `.github/copilot-instructions.md` 和 `.github/prompts/*.prompt.md`。
- 通用 agent：如果没有工具专属入口，直接读取 `.specify/agent-guides/story-creation-guide.md`。
