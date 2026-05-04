# StorySpec 小说创建引导协议

本文是 StorySpec 项目的跨 agent 引导协议。Codex、Claude、Gemini、Cursor、Continue、Copilot 和通用 Markdown agent 都应优先遵循本文，再按自身命令能力降级执行。

## 触发条件

用户提到以下任一意图时，进入本协议：

- `story-spec`、`StorySpec`、小说项目、创建小说、剧情设定、章节规划、写作规格。
- 询问“适不适合”“怎么用”“怎么开始”“帮我写小说”。
- 只给出题材、风格、主角、世界观碎片或一句话灵感。

不要只解释概念。默认目标是把用户带到第一版可执行的 StorySpec 状态。

## 默认响应

先给结论，再把作者带进故事。不要先讲安装、命令和文件结构；只有作者需要落地到项目时，才补充对应命令。

```text
适合。我们先不急着写完整大纲，可以从一个创作入口开始，做第一版可修改的 StorySpec。
```

然后提供入口选择，而不是直接抛命令：

```text
你现在更想从哪里开始？

1. 我有一句灵感，想扩成故事
2. 我有主角，想搭世界和冲突
3. 我有世界观，想找到主线
4. 我有一幕场景，想顺着写下去
5. 我已经有一大段设定，想先整理成可确认资料
6. 我想写类型文，但还没具体想法
```

如果用户已经给出明确入口，直接沿该入口推进，不再重复选择。
如果用户一次给出几百字设定、多个回复、会议记录或“把上面讨论整理一下”，不要强行拆成逐题问答。先把内容归纳为“作者已确认 / 候选 / 待确认”，并建议使用 `storyspec ingest <story> --text "<文本>"` 或 `storyspec co:create <story> --file notes.md` 做本地预览。长文、表格和多回复导入都按 candidate / preview / confirm / apply 处理，待澄清不是失败，确认后再 apply 才会进入正典。

## 低负担启动问题

首次引导最多问 6 个问题。问题要像创作聊天，不要像表格采集。用户回答不完整也继续推进，不追问到表格填满。

```text
1. 类型：玄幻、都市、科幻、悬疑、言情，还是混合？
2. 基调：爽、虐、轻松、黑暗、浪漫、燃？
3. 主角：他/她最想要什么？
4. 阻碍：谁或什么挡住主角？
5. 看点：读者追下去主要为了什么？
6. 边界：你不想写什么？
```

如果用户已经给出部分信息，只问缺失的 1 到 3 项。不要重复索要已提供内容。若作者只想先写一幕，优先问场景中的人物、冲突和结尾钩子，而不是强行补齐世界观。

## 多回复和长文处理

作者可以一次输入多条回答或 500 字以上的创作资料。agent 应当：

- 先按核心创意、主角、伙伴、第一舞台、能力体系、势力冲突、长线威胁和创作边界拆分信息。
- 明确标签或作者直接确认的内容，才放进“作者已确认”。
- 无标题自然段、推断内容和 agent 补全，只放进“候选”或“待确认”。
- 建议作者运行 `storyspec core <story> --missing` 查看核心缺口。
- 已有故事工作区时，优先建议 `storyspec ingest <story> --file notes.md`；想把吸收、核心面板和 preview 串起来时，建议 `storyspec co:create <story> --file notes.md --apply-confirmed --preview specify`。
- 即使使用 `--apply-confirmed`，也只能写入明确字段；候选不能跳过作者确认。

## 生成第一版 StorySpec

拿到足够信息后，输出“第一版 StorySpec 草案”。它应能指导下一步创作，但不要提前锁死全部设定。

草案必须分成三层：

- 作者已确认：只放用户明确说过或已经确认的内容。
- agent 建议：可采用的候选，必须标明仍需确认。
- 待确认：影响后续剧情、人物或世界规则的大问题。

草案内容建议包含：

- 作品定位：类型、基调、读者感受、创作边界。
- 一句话故事：主角目标、阻碍、代价。
- 主角核心：表面目标、深层欲望、缺陷、不能违背的性格原则。
- 关键冲突：外部阻力、内在矛盾、关系张力。
- 世界/规则：只写已确认或高度必要的规则。
- 主线方向：开端、第一转折、中段压力、高潮方向、结局倾向。
- 文风约束：叙事视角、语言密度、节奏偏好、避免写法。
- 下一步入口：玩角色、写一幕、整理设定、比较分支、进入章节规划。

不要把草案写成“最终大纲”。它应该让作者能继续选择、改写、拒绝或稍后决定。

## 推荐文件落点

如果当前 agent 可以写文件，按项目状态选择落点：

- 尚未创建故事：先用对话产出 StorySpec v0 草案，再建议运行 `storyspec story:new <故事名> --idea "<原始灵感>"` 保存原始灵感。
- 已有故事但核心资料分散：先建议运行 `storyspec ingest <story> --file notes.md` 或 `storyspec co:create <story> --file notes.md --preview specify`，再根据 preview 决定是否 `apply`。
- 已有故事但无规格：优先建议运行 `storyspec core <story> --missing` 和 `storyspec preview specify <story>`，不要直接覆盖 `stories/<story>/specification.md`。
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
- 不要把 `storyspec ingest` 的候选项当成 confirmed；无标题长文只能作为候选，直到作者明确确认。
- 不要用大量问题阻塞用户开始创作。

## 工具降级

- Codex：优先读 `AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Claude：优先读 `CLAUDE.md`、`AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Gemini：优先读 `.gemini/GEMINI.md`、`AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Cursor：优先读 `.cursor/rules/story-spec.mdc`、`AGENTS.md`、`.specify/agent-contract.md` 和本文。
- Continue：优先读 `.continue/rules/story-spec.md` 和 `.continue/prompts/*.md`；只读模式下输出补丁式建议。
- Copilot：优先读 `.github/copilot-instructions.md` 和 `.github/prompts/*.prompt.md`。
- 通用 agent：如果没有工具专属入口，直接读取 `.specify/agent-guides/story-creation-guide.md`。
