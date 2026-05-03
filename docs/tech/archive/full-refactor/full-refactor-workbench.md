# 小说工作台重构路线

## 状态

Completed。本文承接 C 系列任务，专注 Context Pack、Draft/Revision、Narrative Tests、Dialogue、Branch、Promise、Research、Style Linter、Compile 和 Feedback。Batch C0-C2 已完成，并已通过 full-refactor 大阶段收尾验证。

## 小说工作台参考项目

| 项目 | 已核对事实 | 对 Novel Writer 的启发 |
|------|------------|------------------------|
| [Twine](https://github.com/tweecode/twine) | GitHub README 将 Twine 描述为 visual tool for creating interactive stories for the Web，并基于 Twee story engine。 | 借鉴分支叙事与可视化 passage 思想，支持剧情 what-if、branch compare、branch promote，而不是只能线性推进。 |
| [Ink](https://github.com/inkle/ink) | GitHub README 将 ink 描述为 open source scripting language for writing interactive narrative，支持高度分支故事，并可编译成 JSON runtime。 | 借鉴“纯文本叙事脚本 + flow/control”思想，用于 Dialogue System、分支探索、场景状态流转。 |
| [Yarn Spinner](https://github.com/YarnSpinnerTool/YarnSpinner) | GitHub README 将 Yarn Spinner 描述为 friendly dialogue tool，可用 screenplay-like format 编写互动对话。 | 对话不应只是正文片段，应有说话人、意图、潜台词、选择/分歧、关系变化、信息揭示等结构化数据。 |
| [Vale](https://github.com/errata-ai/vale) | GitHub README 将 Vale 描述为 markup-aware linter for prose，强调速度和可扩展性。 | 建立中文小说 Style Linter，把“AI 腔、说明式对白、重复句式、现代词穿帮”等变成可配置规则。 |
| [textlint](https://github.com/textlint/textlint) | GitHub README 将 textlint 描述为 pluggable linter for natural language text，并支持 MCP server。 | Novel Writer 的 narrative/style lint 应插件化，并为未来 agent/MCP 调用留接口。 |
| [Foam](https://github.com/foambubble/foam) | GitHub README 将 Foam 描述为 VSCode 中的 personal knowledge management/sharing system，用于 Second Brain、Zettelkasten、写书和长期学习。 | Research Vault 应支持 Markdown 笔记、wiki links、sources、citations，把资料与世界观事实连接。 |
| [Dendron](https://github.com/dendronhq/dendron) | GitHub README 将 Dendron 描述为 local-first、markdown-based note-taking tool，并支持从自由笔记逐步增加结构。 | 世界观/研究资料应允许“先自由记录，后结构化归档”，不要一开始强迫所有资料都有完整 schema。 |
| [mdBook](https://github.com/rust-lang/mdBook) | 官方文档说明 mdBook 用 Markdown 创建在线书籍，Rust Book 就是代表案例。 | Novel Writer 后期需要 compile/export pipeline，把章节、附录、世界观资料编译成可读 manuscript。 |

## 小说工作台能力设计

本节关注“把 Novel Writer 做成长期小说工作台”。如果说 B 系列解决世界观、canon、场景、审稿，本节解决写作执行层的上下文打包、草稿修订、叙事测试、分支探索、研究资料和最终编译。

### Context Pack / Writing Packet

目标：每次写作前生成一个精简、可审计、可复用的上下文包，避免任意 agent 自己乱找文件导致上下文漂移。

建议目录：

```text
.specify/context-packs/
  chapter-003.write-pack.md
  chapter-003.write-pack.json
```

核心对象：

```ts
interface ContextPack {
  id: string;
  purpose: 'write' | 'review' | 'revise' | 'handoff' | 'branch';
  story: string;
  targetTask?: string;
  targetChapter?: string;
  targetScene?: string;
  generatedAt: string;
  mustRead: ContextPackItem[];
  allowedWrites: string[];
  worldFacts: string[];
  canonFacts: string[];
  sceneCards: string[];
  voiceFingerprints: string[];
  recentSummary: string;
  constraints: string[];
  validationChecklist: string[];
}

interface ContextPackItem {
  path: string;
  reason: string;
  required: boolean;
}
```

命令规划：

```bash
novel context:pack --task T012
novel context:pack --chapter 003 --purpose write
novel context:show chapter-003.write-pack
novel context:validate chapter-003.write-pack
```

AI 命令规划：

```text
/context-pack      # 生成或刷新当前写作上下文包
/write-from-pack   # 严格按 context pack 写作
```

验收标准：

- `/write` 如果存在匹配 context pack，应优先读取它。
- context pack 必须说明每个 mustRead 的原因，避免盲目塞上下文。
- `context:validate` 能发现路径缺失、allowedWrites 与任务不一致、pack 过期。
- pack 生成不改正文，只写 `.specify/context-packs/`。

### Draft / Revision 分层

目标：正文不再一生成就成为定稿；引入草稿、审稿、修订和定稿层。

建议目录：

```text
stories/001-story/
  drafts/
    chapter-003.v1.md
    chapter-003.v2.md
  revisions/
    chapter-003.review.md
    chapter-003.revision-plan.md
  content/
    chapter-003.md
```

核心对象：

```ts
interface DraftRecord {
  id: string;
  chapter: string;
  version: number;
  path: string;
  basedOn?: string;
  contextPack?: string;
  status: 'draft' | 'reviewed' | 'approved' | 'published';
  reviewerFindings: string[];
  createdAt: string;
}
```

命令规划：

```bash
novel draft:new --chapter 003
novel draft:list --chapter 003
novel draft:promote chapter-003.v2
novel revise --chapter 003
novel revise --from-review chapter-003.review.md
```

验收标准：

- 默认不覆盖 `content/chapter.md`，除非执行 `draft:promote` 或用户明确确认。
- `handoff` 能显示当前章节 draft 状态。
- `validate` 能检查已标记 published 的章节是否有对应 draft record。

### Narrative Tests

目标：把“这一章好不好看”拆成可检查的叙事测试，类似 Vale/textlint 对 prose 的规则化检查。

测试维度：

- 本章主角是否主动做选择。
- 场景是否有 goal/conflict/outcome。
- 本章开头是否承接上章 promise。
- 本章结尾是否产生新的阅读动力。
- 对话是否推进关系、冲突或信息揭示。
- 是否存在大段无场景承载的解释。
- 是否违反当前类型 preset 的核心承诺。

命令规划：

```bash
novel narrative:test
novel narrative:test --chapter 003
novel narrative:test --scene scene-012
novel narrative:test --json
```

核心对象：

```ts
interface NarrativeTestResult {
  id: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'error' | 'warning' | 'info';
  path: string;
  evidence?: string;
  message: string;
  suggestedAction: string;
}
```

验收标准：

- 第一版可以基于 scene cards、tasks、chapter summary、review findings 做规则检查。
- 每条失败必须引用路径和 evidence。
- narrative tests 可接入 `review --panel editor`，但不直接改正文。

### Dialogue System

目标：结构化管理长篇小说中的对白，尤其服务权谋、恋爱、群像、多角色冲突。

建议目录：

```text
stories/001-story/dialogue/
  chapter-003.scene-002.yaml
```

核心对象：

```ts
interface DialogueBeat {
  id: string;
  sceneId: string;
  speaker: string;
  line: string;
  intent: string;
  subtext?: string;
  relationshipChange?: string;
  reveals: string[];
  hides: string[];
  emotion: string;
  voiceFingerprint?: string;
}
```

命令规划：

```bash
novel dialogue:extract --chapter 003
novel dialogue:check --chapter 003
novel dialogue:plan --scene scene-012
```

AI 命令规划：

```text
/dialogue-plan
/dialogue-review
/dialogue-rewrite
```

验收标准：

- `dialogue:extract` 第一版可生成待确认 YAML，不直接作为 canon。
- `dialogue:check` 能检查说话人不存在、称呼错误、dialogue beat 缺 intent、缺 relationshipChange。
- 与 VoiceFingerprint 和 Reviewer Loop 打通。

### Branch / What-if Exploration

目标：支持剧情路线试验，借鉴 Twine/Ink 的分支思维，但不强制使用 Git branch。

建议目录：

```text
stories/001-story/branches/
  main/
  alt-identity-reveal/
    branch.md
    changed-scenes.yaml
    impact.md
```

核心对象：

```ts
interface StoryBranch {
  id: string;
  base: string;
  title: string;
  premise: string;
  changedScenes: string[];
  changedCanonFacts: string[];
  impactSummary: string;
  status: 'exploring' | 'accepted' | 'rejected' | 'merged';
}
```

命令规划：

```bash
novel branch:create "女主提前识破身份"
novel branch:list
novel branch:compare main alt-identity-reveal
novel branch:promote alt-identity-reveal
```

验收标准：

- branch 默认只写 `stories/*/branches/`，不改 main content/canon。
- `branch:compare` 输出影响的 scene、canon、promise、relationship。
- `branch:promote` 必须生成确认清单，不能静默覆盖 main。

### Promise Tracking / Tension Curve

目标：显式管理读者期待、悬念、爽点、感情张力、复仇线、升级线等“承诺与兑现”。

建议目录：

```text
spec/tracking/promises.json
spec/tracking/tension-curve.json
```

核心对象：

```ts
interface StoryPromise {
  id: string;
  type: 'mystery' | 'revenge' | 'romance' | 'power-up' | 'world-secret' | 'character-goal';
  promise: string;
  establishedAt: string;
  reinforcedAt: string[];
  paidOffAt?: string;
  invertedAt?: string;
  status: 'open' | 'reinforced' | 'paid-off' | 'stale' | 'abandoned';
  readerExpectation: string;
}

interface TensionPoint {
  chapter: string;
  scene?: string;
  tension: number;
  emotionalCharge: number;
  informationGain: number;
  payoff: number;
}
```

命令规划：

```bash
novel promise:list
novel promise:check
novel tension:chart
novel analyze --focus=promise
```

验收标准：

- `promise:check` 能识别 open 太久、payoff 缺 evidence、重复建立但不推进的 promise。
- `tension:chart` 第一版可以输出 JSON/Markdown 表格，不必立即画图。
- `/plan` 和 `/tasks` 应能读取 promise/tension 数据。

### Research Vault

目标：将资料来源、灵感笔记、考据和世界观事实分开管理，并保留引用关系。

建议目录：

```text
research/
  notes/
  sources/
  citations.json
```

核心对象：

```ts
interface ResearchSource {
  id: string;
  title: string;
  type: 'book' | 'article' | 'web' | 'video' | 'interview' | 'personal-note';
  path?: string;
  url?: string;
  accessedAt?: string;
  notes: string[];
}

interface CitationLink {
  sourceId: string;
  targetPath: string;
  targetId?: string;
  reason: string;
}
```

命令规划：

```bash
novel research:add
novel research:list
novel research:link <source-id> <world-fact-id>
novel research:check
```

验收标准：

- Research Vault 不要求联网；默认管理本地来源和用户手动记录。
- WorldFact 可选择关联 research source，但不强制所有设定都引用来源。
- `research:check` 能发现 citation 指向不存在 source 或 target。

### Style Guide as Linter

目标：将“写得不像 AI、中文小说更自然、符合项目文风”变成可配置检查规则。

建议目录：

```text
spec/style/
  style-guide.md
  banned-patterns.yaml
  rhythm-rules.yaml
  diction.yaml
```

规则方向：

- AI 腔：空泛抽象词、模板化转折、机械排比。
- 说明式对白：角色直接说出已知信息或动机。
- 过度心理描写：大量“他意识到/他明白/他感到”。
- 现代词穿帮：历史/玄幻语境中出现不合适词。
- 重复句式：连续段落结构过于相似。
- 节奏问题：长段堆叠、缺少短句停顿、场景切换不清。

命令规划：

```bash
novel style:lint
novel style:lint --chapter 003
novel style:explain <rule-id>
```

验收标准：

- 规则可配置，不能把所有作者都压成同一种文风。
- 每条 lint finding 必须给出 path、ruleId、evidence、suggestion。
- 第一版不强制引入 Vale/textlint 依赖，但设计上允许未来接入。

### Compile / Export Pipeline

目标：将分散章节、scene、front matter、附录编译成可读 manuscript。

建议目录：

```text
build/
  manuscript.md
  manuscript.frontmatter.json
  reports/
```

命令规划：

```bash
novel compile --format markdown
novel compile --format markdown --with-frontmatter
novel compile --include appendix
```

阶段策略：

- 第一版只支持 Markdown。
- 第二版评估 Pandoc/EPUB。
- 第三版再考虑 typeset、illustration、narration 等 autonovel 风格扩展。

验收标准：

- compile 不修改 `stories/*/content/`。
- 输出包含章节顺序、标题、字数统计、缺失章节警告。
- 支持 scene cards 时按 scene order；没有 scene cards 时按章节文件名排序。

### Beta Reader Feedback Loop

目标：让外部读者/编辑反馈进入系统，而不是停留在聊天记录里。

建议目录：

```text
feedback/
  beta-reader-001.md
  feedback.json
```

核心对象：

```ts
interface ReaderFeedback {
  id: string;
  source: string;
  targetPath: string;
  type: 'confusion' | 'boredom' | 'excitement' | 'continuity' | 'style' | 'character' | 'world';
  comment: string;
  suggestedAction?: string;
  status: 'new' | 'triaged' | 'accepted' | 'rejected' | 'done';
}
```

命令规划：

```bash
novel feedback:import feedback/beta-reader-001.md
novel feedback:list
novel feedback:triage
novel feedback:to-tasks
```

验收标准：

- feedback 默认不改正文。
- `feedback:to-tasks` 生成任务草稿，用户确认后再写入 `tasks.md`。
- feedback 可关联 reviewer findings、canon debt、promise tracking。

## 批次化开发计划

Workbench 路线按批次执行，旧 `C*-T*` 编号仅作为范围映射，不再作为逐项开发闸门。每个批次完成后同步更新本文与 [full-refactor-shared.md](full-refactor-shared.md) 的状态。

## 已完成批次

- [x] Batch C0：Workbench 基线与 Context / Draft / Narrative MVP。

  范围：覆盖原 C0-C3 与 Shared N012-N015。新增工作台 ADR，定义公共 finding/task draft 格式，落地 `ContextPack`、`DraftRecord`、`NarrativeTestResult` 最小 schema，并实现 `context:pack`、draft/revision 文件布局、draft 基础命令与 `narrative:test` MVP。

  验收：
  - ADR 明确 C 系列能力边界、MVP 顺序和延期能力。
  - `context:pack --task T001 --json` 输出结构化 pack，且每个 mustRead 都有 reason。
  - draft/revision 不默认覆盖正式正文，`draft:promote` 前有确认摘要。
  - narrative findings 带 path、evidence、suggestedAction，无 scene card 时能 fallback 到章节级检查。

- [x] Batch C1：Dialogue / Branch / Promise 创作扩展。

  范围：覆盖原 C4-C6。实现对白结构化检查与计划、剧情分支安全探索、Promise Tracking / Tension Curve，并把相关信息接入 `/plan`、`/tasks`、`/write` 与 reviewer loop。

  验收：
  - `dialogue:extract` 输出待确认 YAML，不直接写 canon。
  - branch 默认写入 `branches/`，compare 输出结构化影响报告，promote 必须显式确认。
  - `promise:check` 能发现长期未兑现、payoff 缺 evidence、重复建立但不推进的问题。
  - promise/tension findings 可生成任务草稿。

- [x] Batch C2：Research / Style / Compile / Feedback 收口。

  范围：覆盖原 C7-C9。实现 Research Vault、Style Guide as Linter、manuscript compile/export 与 Feedback Loop，并保证这些能力默认不改正文。

  验收：
  - Research Vault 默认不联网，支持自由 Markdown 笔记和 citation 结构校验。
  - `style:lint` finding 包含 ruleId、path、evidence、suggestion，规则可关闭或降级。
  - `compile` 只写 `build/`，输出字数统计、缺失章节警告和 frontmatter。
  - feedback 默认不改正文，`feedback:to-tasks` 生成待确认任务草稿。

## 后续批次

Workbench 主功能批次已完成。后续如实现 `context:show`、`revise`、EPUB/Pandoc 导出、Vale/textlint 接入或反馈深度联动，应作为新增增强批次推进，不回滚 C0-C2 完成状态。
