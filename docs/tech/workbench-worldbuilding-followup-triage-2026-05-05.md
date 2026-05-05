# Worldbuilding / Workbench 后续增强分流表（2026-05-05）

## 范围

- 复核对象：World Bible、Canon Ledger、Entity Graph、Scene Cards、VoiceFingerprint、Reviewer Loop、Context Pack、Draft、Narrative Tests、Dialogue、Branch、Promise、Research、Style、Compile、Feedback。
- 目标：确认归档后保留的 Worldbuilding / Workbench 后续入口是否仍有未实现能力，或已被生态、质量、共创和 full-refactor 路线覆盖。
- 结论：当前没有需要立即转 OpenSpec 的独立 P0/P1 缺口。多数候选已完成或已归属现有归档路线；保留若干 P3 研究储备，不作为活跃待办。

## 验证记录

| 命令 | 结果 | 覆盖 |
| --- | --- | --- |
| `npx vitest run tests/unit/worldbuilding.test.ts tests/unit/inspect-worldbuilding.test.ts tests/unit/inspect-voice.test.ts tests/unit/review-project.test.ts tests/unit/manage-context-packs.test.ts tests/unit/manage-dialogue.test.ts tests/unit/manage-branches.test.ts tests/unit/manage-promises.test.ts tests/unit/compile-manuscript.test.ts` | 9 个测试文件、36 个测试通过 | WorldFact / CanonFact、world/canon inspection、VoiceFingerprint、reviewer loop、Context Pack、Dialogue、Branch、Promise、Compile。 |
| `npx vitest run tests/unit/manage-research.test.ts tests/unit/manage-style.test.ts tests/unit/manage-feedback.test.ts tests/unit/manage-drafts.test.ts tests/unit/run-narrative-tests.test.ts tests/unit/writing-feedback-fixture.test.ts` | 6 个测试文件、17 个测试通过 | Research Vault、Style Linter、Feedback、Draft、Narrative Tests、写作反馈 fixture。 |

## 分流表

| 候选 | 用户收益 | 已有命令 / 基础 | 是否已覆盖 | 建议归属 | 处理 |
| --- | --- | --- | --- | --- | --- |
| WorldFact / CanonFact 来源追踪继续增强 | 防止世界观和正典被 AI 推断污染 | `world:list`、`world:check`、`canon:list`、`canon:check`、source 字段、未确认 AI warning | 已覆盖于 full-refactor B0-B3、创作控制权 D5 | 关闭；新来源问题回到创作控制权专题 | 关闭 |
| 世界观压力和场景证据 | 让设定落到人物行动、代价和场景压力 | `MISSING_WORLD_FACT_PRESSURE`、`sceneEvidencePaths`、WorldFact parser | 已覆盖于 worldbuilding 第一版和共创 F7-F11 | 若真实样例仍空泛，转共创体验或 WorldFact 文案小切片 | 关闭 |
| Entity Graph 深度图谱 | 支持复杂势力、人物、地点关系查询 | `entity:list`、`graph:build`、`graph:check`、`graph:impact` | 第一版已覆盖；复杂可视化明确非目标 | 独立长期 Workbench 研究，需真实使用证据 | P3 储备 |
| Scene Card 写作前门禁 | 防止直接写正文时丢目标、冲突、结果和世界证据 | `scene:init`、`scene:list`、`scene:check`、`scene:compile`、narrative tests | 已覆盖于 full-refactor B、Workbench C、共创 F9 | 关闭；新章节写作问题走章节生产路线 | 关闭 |
| VoiceFingerprint 深化 | 保持角色声音一致 | `voice:list`、`voice:check`、`voice:sample`、reviewer voice panel | 第一版已覆盖；深度 voice model 未有新证据 | 若真实章节声音漂移高频出现，转 reviewer / style 专题 | P3 储备 |
| Reviewer Loop 与权重 | 将审稿发现转任务草稿，并按类型/preset 调权 | `review`、`reviewer-config.json`、preset reviewerWeights | 已覆盖于生态路线和 agent/CI 质量路线 | 关闭；新增 reviewer panel 才另建 OpenSpec | 关闭 |
| Genre Preset / 类型包 | 按类型提供世界观、节奏、reviewer 权重 | `preset:list`、`preset:add`、`preset:doctor`、`mystery` preset、`extension:add` | 已覆盖于生态路线 | 后续新增类型包回到生态增强专题 | 关闭 |
| Context Pack / Draft / Narrative / Dialogue / Branch / Promise | 长篇工作台写作执行层 | `context:pack`、`draft:*`、`narrative:test`、`dialogue:*`、`branch:*`、`promise:*`、`tension:chart` | 已覆盖于 Workbench C0-C1 | 关闭；章节级体验问题回到章节生产或共创路线 | 关闭 |
| Research / Style / Compile / Feedback | 研究资料、文风检查、编译、读者反馈闭环 | `research:*`、`style:*`、`compile`、`feedback:*` | 已覆盖于 Workbench C2 和 agent/CI 质量路线的可选 lint adapter | 关闭；EPUB/Pandoc 或外部 lint 深接入为 P3 | P3 储备 |
| GUI / 可视化工作台 | 降低复杂项目的浏览成本 | 当前无 GUI；归档明确非目标 | 未覆盖，但缺少真实收益证据且范围大 | 新产品专题研究，不进入当前路线 | P3 储备 |

## 不新建 OpenSpec 的原因

- 没有复现 P0/P1 缺陷，也没有发现 README 承诺了未实现能力。
- 当前候选多为“更深、更可视化、更外部集成”的长期增强，缺少真实用户路径证据。
- 类型包、reviewer 权重、lint adapter 已由归档路线完成；重复开路线会制造假活跃待办。

## 后续规则

- 新类型 preset、扩展包、reviewer 权重：回到生态增强专题。
- Vale / textlint 深接入、自然语言质量 CI：回到 agent/CI 质量专题。
- 章节写作前门禁、Context Pack、Scene Card 使用摩擦：回到章节生产或继续创作 dogfood 记录。
- 可视化 GUI、复杂图谱、EPUB/Pandoc：只有真实项目证据显示 CLI/Markdown 不够用时，另建 P3 研究路线。
