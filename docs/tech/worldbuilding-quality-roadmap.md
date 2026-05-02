# Worldbuilding Quality Roadmap

## 状态

Active。本文记录 World Bible、Canon Ledger、Entity Graph、Scene Cards 的第一版边界。当前实现范围是 Batch B0：World / Canon 基座。

## 背景

旧项目已经有：

- `spec/knowledge/*`：世界观、角色、地点等静态知识。
- `spec/tracking/*`：角色状态、关系、时间线、情节进度等动态追踪。
- `stories/*`：规格、计划、任务和正文。

这些文件足够写作，但缺少“事实是否会约束剧情”“正文是否已经写成 canon”的结构化判断。B0 的目标是补上最小事实层，而不是把项目变成数据库或大型写作软件。

## 第一版模型

### WorldFact

WorldFact 记录会影响剧情选择的世界观事实。

必填字段：

- `id`
- `title`
- `summary`
- `storyFunction`
- `constraints`

可选字段：

- `type`
- `sourcePaths`
- `status`

关键原则：没有 `storyFunction` 和 `constraints` 的世界观条目只是百科资料，不应进入 WorldFact。

### CanonFact

CanonFact 记录正文已经写成事实的内容。

必填字段：

- `id`
- `summary`
- `evidence`

可选字段：

- `type`
- `affectedEntities`
- `status`

关键原则：CanonFact 必须有 evidence，第一版不把 AI 推断当事实。

## 目录映射

| 旧/现有文件 | 新模型关系 |
| --- | --- |
| `spec/knowledge/world-setting.md` | WorldFact 的 sourcePaths 来源之一 |
| `spec/knowledge/locations.md` | 可拆成 location 类型 WorldFact |
| `spec/knowledge/character-profiles.md` | 后续 B1/B2 可进入 StoryEntity / VoiceFingerprint |
| `spec/tracking/timeline.json` | CanonFact evidence 和后续 propagation debt 的参考 |
| `spec/tracking/relationships.json` | 后续 StoryEdge / relationship impact 的来源 |
| `stories/*/content/**` | CanonFact evidence 的主要来源 |
| `stories/*/tasks.md` | 写作前的读写边界来源 |

## 当前落地

- 新项目生成 `spec/world/` 和 `spec/canon/`。
- `novel validate --json` 输出 world/canon issue。
- `novel world:list`、`novel world:check` 读取 WorldFact。
- `novel canon:list`、`novel canon:check` 读取 CanonFact。
- `/write` 读取 World Bible 和 Canon Ledger；写完后只生成待确认 canon fact 或 propagation debt，不自动重写正文。

## 非目标

- 不做数据库。
- 不做复杂可视化。
- 不做自动全文重写。
- 不把无 evidence 的推断写入 Canon Ledger。
- 不强制旧项目立即补齐 World Bible / Canon Ledger；缺目录只给 warning。

## 后续批次

- B1：Entity Graph / Scene Card 创作结构。
- B2：Worldbuilding Quality / Voice / Reviewer。
- B3：Genre Preset 包。
