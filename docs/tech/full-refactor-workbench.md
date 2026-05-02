# 小说工作台重构路线

## 状态

Active planning。本文承接 C 系列任务，专注 Context Pack、Draft/Revision、Narrative Tests、Dialogue、Branch、Promise、Research、Style Linter、Compile 和 Feedback。

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

## Phase Tasks

## 阶段 C0：工作台能力 ADR

目标：明确 Context Pack、Draft/Revision、Narrative Tests、Dialogue、Branch、Promise、Research、Style、Compile、Feedback 的边界和优先级。

- [ ] C0-T001：新增 ADR `docs/tech/novel-workbench-roadmap.md`。
- [ ] C0-T002：确定 C 系列第一批 MVP 顺序：建议 Context Pack → Draft/Revision → Narrative Tests → Promise Tracking。
- [ ] C0-T003：定义 C 系列公共 finding/task draft 格式，避免 review、lint、feedback、narrative test 各写一套。
- [ ] C0-T004：补充迁移原则：旧项目不强制引入 drafts、branches、research。
- [ ] C0-T005：列出不做项：不做富文本编辑器、不做多人协作平台、不做自动发布平台。

验收：

- 本阶段只改文档。
- ADR 明确每项能力的最小落地范围和延期能力。

## 阶段 C1：Context Pack

目标：让任意 agent 写作前拿到精简、稳定、可验证的上下文包。

- [ ] C1-T001：新增 `src/domain/context-pack.ts`。
- [ ] C1-T002：新增 `templates/context-pack/write-pack.md`。
- [ ] C1-T003：新增 `novel context:pack`、`context:show`、`context:validate`。
- [ ] C1-T004：`handoff` 可引用最近 context pack。
- [ ] C1-T005：`/write`、generic `write.md` 支持“若存在 context pack，优先按 pack 执行”。
- [ ] C1-T006：context pack 自动收集下一任务、WorldFacts、CanonFacts、SceneCards、VoiceFingerprints、近期摘要、禁止事项。

验收：

- `context:pack --task T001 --json` 输出结构化 pack。
- pack 中每个 mustRead 都有 reason。
- `context:validate` 能发现路径缺失和 pack 过期。

## 阶段 C2：Draft / Revision 分层

目标：让章节经历草稿、审稿、修订、定稿，不默认覆盖正式正文。

- [ ] C2-T001：新增 `src/domain/draft.ts`。
- [ ] C2-T002：初始化 `stories/*/drafts/`、`revisions/` 目录策略。
- [ ] C2-T003：新增 `novel draft:new`、`draft:list`、`draft:promote`。
- [ ] C2-T004：新增 `novel revise --chapter`。
- [ ] C2-T005：`/write` 可选择输出到 drafts，而不是直接写 `content/`。
- [ ] C2-T006：`validate` 检查 draft record 与文件状态一致。

验收：

- `draft:promote` 前显示确认摘要。
- `content/chapter.md` 不被自动覆盖。
- `status` 能显示当前章节 draft 状态。

## 阶段 C3：Narrative Tests

目标：把章节好坏拆成可检查的叙事规则。

- [ ] C3-T001：新增 `src/validation/rules/narrative-tests.ts`。
- [ ] C3-T002：新增 `novel narrative:test`。
- [ ] C3-T003：支持 `--chapter`、`--scene`、`--json`。
- [ ] C3-T004：将 narrative test finding 接入 reviewer findings 或 validate issue。
- [ ] C3-T005：支持 preset 注入 narrative test 权重和额外规则。

验收：

- 至少覆盖 goal/conflict/outcome、主角选择、章节结尾动力、对话推进功能四类规则。
- findings 必须带 path、evidence、suggestedAction。
- 无 scene card 时能 fallback 到章节级检查。

## 阶段 C4：Dialogue System

目标：结构化规划、检查和改写对白。

- [ ] C4-T001：新增 `src/domain/dialogue.ts`。
- [ ] C4-T002：新增 `stories/*/dialogue/` 模板。
- [ ] C4-T003：新增 `novel dialogue:extract`、`dialogue:check`、`dialogue:plan`。
- [ ] C4-T004：新增 `/dialogue-plan`、`/dialogue-review`、`/dialogue-rewrite`。
- [ ] C4-T005：DialogueBeat 与 VoiceFingerprint、Relationship tracking、Canon reveals 打通。
- [ ] C4-T006：`review --panel character` 读取 dialogue beats。

验收：

- `dialogue:extract` 输出待确认 YAML，不直接写 canon。
- `dialogue:check` 能发现说话人不存在、缺 intent、称呼错误。
- dialogue rewrite 默认输出建议。

## 阶段 C5：Branch / What-if Exploration

目标：安全探索剧情分支，比较影响，选择是否提升为主线。

- [ ] C5-T001：新增 `src/domain/story-branch.ts`。
- [ ] C5-T002：新增 `stories/*/branches/` 结构。
- [ ] C5-T003：新增 `novel branch:create`、`branch:list`、`branch:compare`、`branch:promote`。
- [ ] C5-T004：branch compare 读取 scene、canon、promise、relationship、world impact。
- [ ] C5-T005：branch promote 生成确认清单和 propagation debt。

验收：

- branch 默认不改 main content/canon。
- compare 输出结构化影响报告。
- promote 必须显式确认。

## 阶段 C6：Promise Tracking / Tension Curve

目标：管理读者期待、悬念、爽点、感情张力和兑现节奏。

- [ ] C6-T001：新增 `spec/tracking/promises.json`、`tension-curve.json` 模板。
- [ ] C6-T002：新增 `src/domain/story-promise.ts`。
- [ ] C6-T003：新增 `novel promise:list`、`promise:check`、`tension:chart`。
- [ ] C6-T004：新增 `novel analyze --focus=promise`。
- [ ] C6-T005：`/plan`、`/tasks`、`/write` 读取 open promises。
- [ ] C6-T006：reviewer loop 增加 promise/tension 维度。

验收：

- `promise:check` 能发现 open 太久、payoff 缺 evidence、重复建立不推进。
- `tension:chart` 第一版输出 Markdown/JSON 表格。
- promise finding 能生成任务草稿。

## 阶段 C7：Research Vault

目标：把资料来源与世界观事实连接，支持考据、灵感、引用管理。

- [ ] C7-T001：新增 `research/notes/`、`research/sources/`、`research/citations.json` 模板。
- [ ] C7-T002：新增 `src/domain/research.ts`。
- [ ] C7-T003：新增 `novel research:add`、`research:list`、`research:link`、`research:check`。
- [ ] C7-T004：WorldFact 支持可选 citation links。
- [ ] C7-T005：`context:pack` 可包含相关 research 摘要。

验收：

- 默认不联网，不自动抓取网页。
- `research:check` 能发现 citation 指向不存在 source/target。
- Research Vault 支持自由 Markdown 笔记，不强迫全部结构化。

## 阶段 C8：Style Guide as Linter

目标：把项目文风与中文小说质量规则变成可配置 lint。

- [ ] C8-T001：新增 `spec/style/style-guide.md`、`banned-patterns.yaml`、`rhythm-rules.yaml`、`diction.yaml`。
- [ ] C8-T002：新增 `src/validation/rules/style-linter.ts`。
- [ ] C8-T003：新增 `novel style:lint`、`style:explain`。
- [ ] C8-T004：支持按 preset 或项目本地 override 加载规则。
- [ ] C8-T005：评估未来对接 Vale/textlint 的 adapter，但第一版不强依赖。

验收：

- lint finding 包含 ruleId、path、evidence、suggestion。
- 规则可关闭或降级，不把所有作者压成同一种风格。
- 至少覆盖 AI 腔、说明式对白、重复句式、现代词穿帮四类。

## 阶段 C9：Compile / Export 与 Feedback Loop

目标：把作品编译成可读 manuscript，并让外部反馈进入任务系统。

- [ ] C9-T001：新增 `novel compile --format markdown`。
- [ ] C9-T002：compile 支持 scene order 和章节文件名 fallback。
- [ ] C9-T003：compile 输出字数统计、缺失章节警告、frontmatter。
- [ ] C9-T004：新增 `feedback/` 模板与 `src/domain/feedback.ts`。
- [ ] C9-T005：新增 `novel feedback:import`、`feedback:list`、`feedback:triage`、`feedback:to-tasks`。
- [ ] C9-T006：feedback 可关联 reviewer findings、canon debt、promise tracking。

验收：

- compile 不改正文，只写 `build/`。
- feedback 默认不改正文。
- `feedback:to-tasks` 默认生成草稿，用户确认后才写入任务文件。
