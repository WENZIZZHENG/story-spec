# 世界观与写作质量重构路线

## 状态

Active planning。本文承接 B 系列任务，专注 World Bible、Canon Ledger、Entity Graph、Scene Cards、揭示节奏、角色声音、Reviewer Loop 和类型 Preset。

## 写作与世界观参考项目

| 项目 | 已核对事实 | 对 Novel Writer 的启发 |
|------|------------|------------------------|
| [novelWriter](https://github.com/vkbo/novelWriter) | GitHub README 说明它用 human readable text files 存储，适合版本控制和同步；官方功能强调多文档拆分、notes、synopsis、metadata、tags/references。 | Novel Writer 应坚持本地 Markdown/JSON 可读文件，同时强化 synopsis、metadata、tags/references，让世界观和正文互相可追溯。 |
| [Manuskript](https://github.com/olivierkes/manuskript) | README 将其定位为 open-source writer tool，并展示 story line、plot、character、频率分析、自动保存、开放纯文本格式等能力。 | 需要补齐“故事线/角色/世界/情节”工作台，而不是只有章节生成；频率/重复/用词分析可进入质量检查。 |
| [Longform](https://github.com/kevboh/longform) | README 描述它把 notes/scenes 组织成有序 manuscript，支持 Scenes/Project/Compile、场景列表、draft/project word counts 和 compile workflow。 | Novel Writer 应引入 Scene Card、Draft/Revision、Compile/Export 工作流，把章节拆成可重排、可验证的场景单元。 |
| [NousResearch/autonovel](https://github.com/NousResearch/autonovel) | README 的 pipeline 第一阶段构建 world、characters、outline、voice、canon；后续顺序写章节，并有 revise/typeset/illustrate/narrate 等流程。 | 最值得借鉴的是 foundation-first：World Bible、Characters、Voice、Canon 必须成为写作前的基础资产，并随正文反向更新。 |
| [KazKozDev/NovelGenerator](https://github.com/KazKozDev/NovelGenerator) | README 描述 coordinated multi-agent system、Story Context Database、persistent tracking of character states、plot threads、world facts，以及 consistency checking。 | Novel Writer 需要 Story Context DB/Canon Ledger，把角色状态、世界事实、情节线、时间线做成可查询、可校验的持久上下文。 |
| [Plot Bunni](https://plotbunni.com/) | 项目站点说明其组织 characters、locations、lore 等 story building blocks，并支持 hierarchical story planning（acts、chapters、scenes）。 | 需要把“设定资料”升级成 typed building blocks，并把 act/chapter/scene 的层级结构显式化。 |

## 世界观与写作质量能力设计

本节是后续让 Novel Writer 真正帮助“建立完整小说世界观、写出更好正文”的核心路线。它与 agent-neutral 重构并行：agent-neutral 解决“谁来触发”，本节解决“写什么、怎么保持世界一致、怎么持续变好”。

### 设计原则

- 世界观不是百科，而是剧情约束系统。每条设定都必须说明剧情功能、适用范围、边界和修改影响。
- 章节不是孤立正文，而是 scene cards 的渲染结果。每个场景都应知道 POV、地点、时间、目标、冲突、结果和承担的揭示/伏笔职责。
- Canon 是已经生效的事实，不等同于草稿设定。正文一旦写入读者可见事实，就需要进入 Canon Ledger。
- 任何世界观修改都要产生 propagation debt：哪些章节、任务、角色状态、关系、伏笔需要重新检查。
- 质量检查要从单点一致性升级为 reviewer loop：普通读者、类型读者、编辑、世界观审稿人、角色审稿人分别给出不同维度反馈。

### World Bible

目标：把 `spec/knowledge/world-setting.md` 升级为结构化 World Bible，同时保留 Markdown 可读性。

建议目录：

```text
spec/world/
  world-bible.md
  rules.yaml
  factions.yaml
  locations.yaml
  history.yaml
  systems.yaml
  artifacts.yaml
  glossary.yaml
```

核心对象：

```ts
interface WorldFact {
  id: string;
  type: 'rule' | 'location' | 'faction' | 'history' | 'system' | 'artifact' | 'custom';
  name: string;
  summary: string;
  storyFunction: string;
  constraints: string[];
  firstMention?: string;
  relatedEntities: string[];
  visibility: 'author-only' | 'reader-known' | 'partial-reveal';
  mutable: boolean;
  source: string;
}
```

命令规划：

```bash
novel world:init
novel world:add --type faction
novel world:list --type location
novel world:check
novel world:impact "修改灵气体系"
```

验收标准：

- 新项目初始化时可生成最小 `spec/world/world-bible.md` 和 typed YAML/JSON 模板。
- `novel validate` 能检查 WorldFact 是否缺少 `storyFunction` 或 `constraints`。
- `/write` 或 generic `write.md` 必须把相关 WorldFact 作为写作前上下文。
- `world:impact` 能列出受影响的章节、任务、角色和 canon facts，即使第一版只是基于显式引用。

### Canon Ledger

目标：记录“已经成为小说事实”的内容，并追踪修改影响。

建议目录：

```text
spec/canon/
  facts.md
  facts.json
  contradictions.md
  propagation-debt.json
```

核心对象：

```ts
interface CanonFact {
  id: string;
  statement: string;
  category: 'character' | 'world' | 'plot' | 'relationship' | 'timeline' | 'style';
  evidence: CanonEvidence[];
  firstChapter?: string;
  readerVisibility: 'known' | 'hidden' | 'misdirection' | 'revealed-later';
  reversible: boolean;
  affectedEntities: string[];
  supersedes?: string[];
}

interface CanonEvidence {
  path: string;
  quote?: string;
  chapter?: string;
  sceneId?: string;
}

interface PropagationDebt {
  id: string;
  reason: string;
  changedFactId: string;
  affectedPaths: string[];
  requiredActions: Array<'review' | 'rewrite' | 'update-tracking' | 'update-world' | 'update-task'>;
  severity: 'error' | 'warning' | 'info';
  status: 'open' | 'resolved';
}
```

命令规划：

```bash
novel canon:add
novel canon:list
novel canon:check
novel canon:diff
novel canon:impact <fact-id>
novel canon:resolve <debt-id>
```

AI slash/generic 命令规划：

```text
/canon-update     # 从新章节提取新增事实，更新 canon
/canon-check      # 检查正文与 canon 冲突
/impact           # 评估修改某设定/事实的影响范围
```

验收标准：

- 写完章节后，`handoff` 或 `/write` 完成步骤提示更新 Canon Ledger。
- `canon:check` 能发现同一实体互斥事实，例如角色年龄、地点归属、能力边界冲突。
- `canon:diff` 能比较章节新增事实与已有 canon，并输出新增、冲突、待确认三类。
- 修改 WorldFact 或 CanonFact 时生成 propagation debt，不直接自动重写正文。

### Entity Graph

目标：把角色、地点、组织、物品、事件、线索、世界规则做成可查询图谱，支持长篇一致性和影响分析。

建议目录：

```text
spec/graph/
  entities.json
  edges.json
  indexes.json
```

核心对象：

```ts
interface StoryEntity {
  id: string;
  type: 'character' | 'location' | 'faction' | 'item' | 'event' | 'concept' | 'clue' | 'rule';
  name: string;
  aliases: string[];
  status: 'active' | 'inactive' | 'dead' | 'unknown' | 'retired';
  sourcePaths: string[];
  tags: string[];
}

interface StoryEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  evidencePaths: string[];
  timeRange?: {
    start?: string;
    end?: string;
  };
  confidence: 'explicit' | 'inferred' | 'draft';
}
```

命令规划：

```bash
novel entity:list --type character
novel entity:show <id>
novel graph:build
novel graph:query "沈玉卿知道哪些秘密"
novel graph:impact <entity-id>
```

验收标准：

- 第一版可以从 `character-profiles.md`、`relationships.json`、`timeline.json`、`plot-tracker.json` 和 Canon Ledger 构建图谱。
- graph 需要记录 evidencePaths，不能只有 AI 推断。
- `validate` 能检查 edge 引用不存在 entity 的错误。
- `handoff` 能把下一任务相关 entity 子图写入上下文包。

### Scene Cards

目标：把章节正文背后的结构显式化，支持重排、审稿、节奏分析和编译导出。

建议目录：

```text
stories/001-story/
  scenes/
    scene-001.yaml
    scene-002.yaml
  content/
    chapter-001.md
```

核心对象：

```ts
interface SceneCard {
  id: string;
  chapter: string;
  order: number;
  pov: string;
  location: string;
  time: string;
  sceneGoal: string;
  conflict: string;
  outcome: string;
  emotionalTurn: string;
  worldElements: string[];
  canonFacts: string[];
  reveals: string[];
  foreshadowing: {
    planted: string[];
    paidOff: string[];
  };
  requiredReads: string[];
  allowedWrites: string[];
  draftPath?: string;
}
```

命令规划：

```bash
novel scene:init
novel scene:list
novel scene:check
novel scene:compile
novel scene:move <scene-id> --after <scene-id>
```

AI 命令规划：

```text
/scene-plan       # 从 creative-plan/tasks 生成 scene cards
/scene-write      # 按 scene card 写正文
/scene-review     # 检查场景目标、冲突、结果是否成立
```

验收标准：

- `/tasks` 后可以选择生成 scene cards。
- `/write` 可按章节任务或 scene card 写作；若 scene card 存在，优先使用 scene card。
- `scene:check` 能发现缺 POV、缺冲突、缺 outcome、scene order 重复、scene 引用不存在 entity。
- `scene:compile` 第一版只需按顺序拼接正文路径或输出章节草稿清单。

### Reveal Pacing 与 World Density

目标：检查设定揭示节奏和世界观密度，避免设定堆砌或设定断裂。

检查维度：

- 每章新增 WorldFact/CanonFact 数量。
- 每章设定解释字数占比。
- 新设定是否有场景承载。
- 是否存在“先用后解释”或“解释后长期不用”的悬空设定。
- 关键规则是否首次出现太晚。
- 伏笔、线索、反转是否有足够提前量。

命令规划：

```bash
novel analyze --focus=world-density
novel analyze --focus=reveal-pacing
novel analyze --focus=foreshadowing
```

验收标准：

- 输出按 chapter/scene 分组，而不是只给总评。
- 每条问题必须引用 WorldFact/CanonFact/SceneCard 或正文路径。
- severity 遵循现有 `error|warning|info`。
- 第一版可采用启发式统计，后续再接 AI reviewer。

### Character Voice Fingerprint

目标：让角色对白更稳定，避免所有人物说话都像同一个 AI。

建议目录：

```text
spec/voice/
  character-voices.yaml
  narrator-voice.md
  samples/
    character-001.md
```

核心对象：

```ts
interface VoiceFingerprint {
  characterId: string;
  sentenceLength: 'short' | 'mixed' | 'long';
  diction: string[];
  forbiddenWords: string[];
  addressRules: Record<string, string>;
  emotionalExpression: string;
  conflictStyle: 'avoidant' | 'direct' | 'sarcastic' | 'silent' | 'performative';
  lieMarkers: string[];
  samplePaths: string[];
}
```

命令规划：

```bash
novel voice:init
novel voice:check
novel voice:sample <character-id>
```

AI 命令规划：

```text
/voice-fingerprint     # 从已有正文提取角色声音指纹
/voice-rewrite         # 按角色声音重写指定对话
```

验收标准：

- `voice:check` 能检查禁用词、称呼错误、角色声音样本缺失。
- `/write` 写对话前必须读取相关 `VoiceFingerprint`。
- reviewer loop 中加入“角色声音审稿人”。

### Reviewer Loop

目标：把 `/analyze` 从单一评价升级为多角色审稿循环。

建议 reviewer：

- 普通读者：是否看懂、是否想读下一章。
- 类型读者：是否满足类型承诺，例如玄幻爽点、权谋博弈、恋爱张力。
- 编辑：节奏、重复、结构松散、信息密度。
- 世界观审稿人：规则是否自洽、设定是否突然。
- 角色审稿人：动机、对白、关系变化是否可信。
- Continuity 审稿人：canon、timeline、relationship、scene card 是否冲突。

建议输出：

```json
{
  "reviewers": [
    {
      "id": "worldbuilding",
      "score": 82,
      "findings": [
        {
          "severity": "warning",
          "path": "stories/001/content/chapter-003.md",
          "message": "灵气规则首次用于战斗，但 WorldFact 中没有代价约束"
        }
      ]
    }
  ],
  "nextActions": []
}
```

命令规划：

```bash
novel review
novel review --panel world,character,editor
novel review --chapter 003
novel review --json
```

AI 命令规划：

```text
/review-panel
/review-world
/review-character
/review-reader
```

验收标准：

- reviewer findings 可进入 `novel validate` 或单独 `novel review --json`。
- 每条 finding 必须有路径、严重级别、依据和建议动作。
- reviewer loop 不直接改正文，只生成建议和任务草稿。

### 类型 Preset 包

目标：把“玄幻、权谋、恋爱、悬疑”等类型的世界观字段、节奏模板、检查规则沉淀为 preset。

建议内置 preset：

```text
presets/
  xuanhuan-cultivation/
  court-intrigue/
  urban-fantasy/
  mystery/
  romance-slow-burn/
  realism/
```

每个 preset 包含：

- World Bible 必填字段。
- 角色功能位。
- 常见场景类型。
- 节奏模板。
- 常见错误清单。
- reviewer 权重。
- validate 规则增强。

命令规划：

```bash
novel preset:list
novel preset:add xuanhuan-cultivation
novel preset:doctor
```

验收标准：

- preset 不覆盖用户正文，只新增/增强模板、规则和 reviewer 配置。
- `/specify`、`/plan`、`/tasks` 能读取当前 preset。
- `validate` 能按 preset 检查必填世界观字段。

## Phase Tasks

## 阶段 B0：世界观基线与 ADR

目标：确定 World Bible、Canon Ledger、Scene Cards 的最小可交付边界，避免一次性做成大型写作软件。

- [ ] B0-T001：新增 ADR `docs/tech/worldbuilding-quality-roadmap.md`，说明为什么引入 World Bible、Canon Ledger、Entity Graph、Scene Cards。
- [ ] B0-T002：盘点现有 `spec/knowledge/*`、`spec/tracking/*`、`stories/*` 与新模型的映射关系。
- [ ] B0-T003：决定第一版结构化格式：YAML、JSON、Markdown frontmatter 的边界。
- [ ] B0-T004：定义最小 schema：`WorldFact`、`CanonFact`、`StoryEntity`、`StoryEdge`、`SceneCard`、`VoiceFingerprint`。
- [ ] B0-T005：补充迁移策略：已有项目如何从 `world-setting.md`、`character-profiles.md`、`relationships.json` 迁移。

验收：

- 本阶段只允许文档和 schema 草案，不改生成行为。
- ADR 明确第一版不做数据库、不做复杂可视化、不做自动全文重写。

## 阶段 B1：World Bible MVP

目标：让世界观从松散笔记升级为可校验的剧情约束。

- [ ] B1-T001：新增 `templates/world/`，包含 `world-bible.md`、`rules.yaml`、`factions.yaml`、`locations.yaml`、`history.yaml`、`systems.yaml`、`artifacts.yaml`。
- [ ] B1-T002：`init` 生成 `spec/world/` 模板；`upgrade` 可选择补齐缺失模板。
- [ ] B1-T003：新增 `src/domain/world-fact.ts` 与 parser/validator。
- [ ] B1-T004：`novel validate` 检查 WorldFact 缺 `storyFunction`、缺 `constraints`、引用不存在 entity。
- [ ] B1-T005：新增 `novel world:list`、`novel world:check`。
- [ ] B1-T006：`/write` 和 generic `write.md` 加入 World Bible 读取顺序。

验收：

- 新项目有 `spec/world/`。
- `novel validate --json` 输出 world issue。
- 没有 World Bible 的旧项目只给 warning，不阻断写作。

## 阶段 B2：Canon Ledger 与传播债务

目标：把“正文已经写成事实”的内容记录下来，并在设定变更时产生可追踪的影响清单。

- [ ] B2-T001：新增 `templates/canon/facts.md`、`facts.json`、`contradictions.md`、`propagation-debt.json`。
- [ ] B2-T002：新增 `src/domain/canon.ts`，定义 `CanonFact`、`CanonEvidence`、`PropagationDebt`。
- [ ] B2-T003：新增 `novel canon:list`、`novel canon:check`、`novel canon:diff`、`novel canon:impact`。
- [ ] B2-T004：`handoff` 增加 canon 摘要、open propagation debt 数量、下一任务相关 canon facts。
- [ ] B2-T005：`/write` 完成步骤新增 canon update checklist。
- [ ] B2-T006：新增 `/canon-update`、`/canon-check` 或 generic command 文档。

验收：

- `canon:check` 能发现明显互斥事实和 evidence 缺失。
- `canon:impact` 能基于 evidencePaths/affectedEntities 输出受影响路径。
- 写作流程不会自动重写正文，只生成 debt 和建议动作。

## 阶段 B3：Entity Graph

目标：将角色、地点、组织、物品、事件、线索、规则连接成可查询图谱。

- [ ] B3-T001：新增 `spec/graph/entities.json`、`edges.json` 模板。
- [ ] B3-T002：新增 `src/domain/story-entity.ts` 与 graph builder。
- [ ] B3-T003：从 `character-profiles.md`、`relationships.json`、`timeline.json`、`plot-tracker.json`、Canon Ledger 构建第一版 entity graph。
- [ ] B3-T004：新增 `novel graph:build`、`novel entity:list`、`novel entity:show`、`novel graph:impact`。
- [ ] B3-T005：`validate` 检查 edge 引用不存在 entity、alias 重复、entity 无 sourcePaths。
- [ ] B3-T006：`handoff` 为下一任务输出相关 entity 子图。

验收：

- graph builder 不依赖 AI 推断也能从显式文件构建基础图谱。
- 每条 edge 都保留 evidencePaths。
- `graph:impact` 可辅助 Canon/World impact。

## 阶段 B4：Scene Cards 与编译工作流

目标：让章节写作基于场景卡，支持场景级规划、校验、重排和编译。

- [ ] B4-T001：新增 `templates/scenes/scene-template.yaml`。
- [ ] B4-T002：新增 `src/domain/scene-card.ts` 与 parser/validator。
- [ ] B4-T003：新增 `novel scene:init`、`novel scene:list`、`novel scene:check`、`novel scene:compile`。
- [ ] B4-T004：新增 `/scene-plan`、`/scene-write`、`/scene-review` generic/slash command。
- [ ] B4-T005：`/write` 检测到 scene card 时优先按 scene card 写作。
- [ ] B4-T006：`tasks:board` 显示任务关联 scene card。

验收：

- scene 缺 POV、location、time、sceneGoal、conflict、outcome 时 validate 给 warning/error。
- `scene:compile` 可按 scene order 输出章节草稿索引。
- 不强制所有旧章节立即补 scene cards。

## 阶段 B5：世界观密度、揭示节奏与伏笔检查

目标：减少设定堆砌、设定断裂、伏笔无回收等长篇常见问题。

- [ ] B5-T001：新增 `src/validation/rules/world-density-rules.ts`。
- [ ] B5-T002：新增 `src/validation/rules/reveal-pacing-rules.ts`。
- [ ] B5-T003：`novel analyze --focus=world-density` 输出每章/每场设定密度。
- [ ] B5-T004：`novel analyze --focus=reveal-pacing` 输出设定首次出现、再次使用、悬空设定。
- [ ] B5-T005：`novel analyze --focus=foreshadowing` 对伏笔埋设/回收做检查。
- [ ] B5-T006：将严重问题接入 `novel validate` 或 reviewer findings。

验收：

- 所有 finding 必须引用 chapter/scene/world/canon 路径。
- 第一版允许启发式统计，但输出必须可解释。
- 不因为没有 scene card 就完全失效，应能 fallback 到章节正文。

## 阶段 B6：角色声音指纹

目标：提升对白质量，减少角色声音同质化。

- [ ] B6-T001：新增 `spec/voice/character-voices.yaml` 与 `narrator-voice.md` 模板。
- [ ] B6-T002：新增 `VoiceFingerprint` schema 和 validator。
- [ ] B6-T003：新增 `novel voice:check`、`novel voice:sample`。
- [ ] B6-T004：新增 `/voice-fingerprint`，从已有正文提取角色声音草案。
- [ ] B6-T005：新增 `/voice-rewrite`，只针对对话片段生成 rewrite 建议，不直接覆盖正文。
- [ ] B6-T006：`/write` 读取当前 POV/参与角色的 voice fingerprint。

验收：

- `voice:check` 能发现称呼错误、禁用词、主要角色缺 voice fingerprint。
- voice reviewer 可进入 reviewer loop。
- 任何自动 rewrite 必须默认输出建议，不直接覆盖正文。

## 阶段 B7：Reviewer Loop

目标：把 `/analyze` 升级为多审稿人面板，输出结构化 findings 和下一步任务草稿。

- [ ] B7-T001：定义 reviewer registry：reader、genre、editor、worldbuilding、character、continuity。
- [ ] B7-T002：新增 `novel review`、`novel review --panel`、`novel review --chapter`、`novel review --json`。
- [ ] B7-T003：新增 `/review-panel`、`/review-world`、`/review-character`、`/review-reader`。
- [ ] B7-T004：review findings 输出 path、severity、evidence、suggestedAction。
- [ ] B7-T005：review 可生成 `tasks.md` 草稿项，但不直接写入，除非用户确认。
- [ ] B7-T006：`handoff` 可包含最近 reviewer findings 摘要。

验收：

- reviewer findings 与 validate issue 结构兼容或可转换。
- `review --json` 可被自动化消费。
- reviewer loop 不直接改正文。

## 阶段 B8：类型 Preset 包

目标：将类型小说知识沉淀为可安装 preset。

- [ ] B8-T001：定义 `PresetManifest`，复用插件 resolution stack。
- [ ] B8-T002：新增 `presets/xuanhuan-cultivation`，作为首个完整样板。
- [ ] B8-T003：样板包含 World Bible 必填字段、角色功能位、节奏模板、常见错误、reviewer 权重、validate 规则。
- [ ] B8-T004：新增 `novel preset:list`、`novel preset:add`、`novel preset:doctor`。
- [ ] B8-T005：`/specify`、`/plan`、`/tasks` 读取当前 preset。
- [ ] B8-T006：README/docs 增加 preset 使用示例。

验收：

- preset 不覆盖用户正文。
- `validate` 能按 preset 检查必填世界观字段。
- 后续可以按同一结构新增 court-intrigue、urban-fantasy、mystery、romance-slow-burn。
