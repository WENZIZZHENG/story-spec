# 共创输入与核心信息面板路线图

## 状态

Active。

## 当前主线

把 StorySpec 从“逐题问答工具”升级为“创作资料吸收器 + 核心信息面板 + 确认门禁”，降低作者输入成本，同时继续保护作者创作控制权。

## 非目标

- 不引入大模型调用或联网解析；首批只做本地规则、结构化输出和确认流程增强。
- 不让 AI 候选绕过 `preview / apply` 或 `confirmed: true` 门禁。
- 不把最终反派、长线威胁真相、感情线归属等高影响内容自动定稿。

## P0 立即处理

### P0-1 核心信息面板命令

- 类型：CLI 体验、创作控制权展示。
- 状态：基础版已落地，`storyspec core [story]` 支持 `--json` 与 `--missing`。
- 背景/问题：`creative:report` 已有核心要素面板，但报告信息量大，作者想快速查看世界观、类型、能力体系、风格、核心边界等“故事核心信息”。
- 已有基础：`src/domain/story-core-elements.ts`、`src/application/creative-report.ts` 已能评估核心要素状态。
- 缺口：核心信息面板基础命令已补齐；后续还可继续扩展势力与冲突、长线威胁、类型体验、成功路线、独特声音等细项。
- 建议方案：
  1. 新增 `src/application/story-core-summary.ts`，复用 `createCreativeReport` 的评估结果，生成核心面板数据。
  2. 新增 `storyspec core [story]` 命令，支持 `--json` 和 `--missing`。
  3. 帮助文案中登记 `core` 命令。
- 涉及文件/模块：`src/application/story-core-summary.ts`、`src/cli/commands/core.command.ts`、`src/cli/program.ts`、`tests/unit/story-core-summary.test.ts`、`tests/smoke/cli-commands.test.ts`。
- 验收标准：
  - `storyspec core 法术程序师` 输出核心创意、主角、伙伴、第一舞台、能力体系、势力与冲突、长线威胁、类型体验、成功路线、独特声音、创作边界。
  - `storyspec core 法术程序师 --missing` 只输出缺失、部分确认或稍后决定项。
  - `storyspec core 法术程序师 --json` 输出稳定 JSON，区分 `confirmed / partial / missing / suggested / deferred`。
- 参考资料：本项目 `creative:report` 的核心要素面板；不照搬为长报告，只抽出高频查看视图。
- 不做/边界：不修改澄清记录，不生成新设定。

### P0-2 长文吸收与批量澄清预览

- 类型：CLI 工作流、输入体验。
- 状态：基础版已落地，`storyspec ingest [story]` 支持 `--text`、`--file`、`--apply-confirmed` 和 `--json`。
- 背景/问题：作者自然会一次输入几百字设定，逐题输入 `questionId=answer` 成本高。
- 已有基础：`interview --answers` 已支持分号分隔的多字段写入，`clarifications.json` 已有来源与确认状态。
- 缺口：长文预览和明确字段写入已补齐；后续可继续增强中文别名、无标题段落识别和候选项分组。
- 建议方案：
  1. 新增 `storyspec ingest [story] --text <text>` 与 `--file <path>`。
  2. 首批用本地规则识别明确段落和关键词，映射到 `core.premise`、`core.protagonist`、`core.stage`、`core.partner`、`focus.power`、`core.faction-conflict`、`core.scope` 等常用字段。
  3. 默认只生成预览，不写入；`--apply-confirmed` 后写入识别为作者明确表达的内容。
  4. 输出“建议写入 / 保留候选 / 仍需确认”的分组。
- 涉及文件/模块：新增 `src/application/ingest-story-input.ts`、`src/cli/commands/ingest.command.ts`、相关单测和 CLI 冒烟测试。
- 验收标准：
  - 500 字以上长文能被拆成多个候选写入项。
  - 默认 dry-run 不修改 `clarifications.json`。
  - `--apply-confirmed` 只写入 `source: user-explicit`、`confirmed: true` 的明确项。
- 参考资料：`interview --answers` 的批量写入格式；不照搬交互问卷。
- 不做/边界：不接入 LLM；不声称语义识别完美；复杂长文允许保留为候选和人工确认。

## P1 近期增强

### P1-1 预览摘要与来源 diff

- 类型：preview/apply 体验。
- 背景/问题：`preview specify` 只显示风险和文件路径，作者难以判断“这次到底会写入什么”。
- 建议方案：给 `preview specify/plan` 增加摘要区，展示新增/更新项、来源、仍待确认项和风险。
- 验收标准：预览报告中出现“将写入的作者确认项 / agent 建议 / 待确认项 / 风险”。
- 不做/边界：不替代 `git diff`，只做写入前可读摘要。

### P1-2 规格文档结构与完整文本

- 类型：规格文档可读性。
- 背景/问题：当前 `specification.md` 中部分确认内容被截断为 `...`，不适合当“故事圣经 v0”长期阅读。
- 建议方案：调整规格生成器，核心确认内容完整保留；按“类型与阅读承诺 / 世界观 / 社会结构矛盾 / 能力体系 / 主角与成长线 / 核心伙伴 / 第一舞台 / 第一卷冲突 / 长线伏笔 / 创作边界 / 待确认”组织。
- 验收标准：正式规格不截断作者确认答案；仍明确标注作者确认、agent 建议和待确认。
- 不做/边界：不把未确认建议提升为正典。

## P2 体验和效率

### P2-1 用户无需记忆 questionId

- 类型：输入体验。
- 背景/问题：普通作者不应记 `core.stage=...` 这类内部字段。
- 建议方案：在 `interview` 或 `ingest` 中支持别名，如 `主角=...;第一舞台=...;伙伴=...`，内部映射到 question id。
- 验收标准：中文别名能写入对应澄清字段；未知别名给出可选建议，不静默丢弃。
- 不做/边界：不改变现有 `questionId=answer` 兼容格式。

### P2-2 候选/正典可视化标记

- 类型：CLI 输出可读性。
- 背景/问题：作者需要一眼区分作者确认、AI 候选、不可定稿和待澄清。
- 建议方案：在核心面板、creative report 和 preview 摘要中统一标记 `作者确认 / AI 候选 / 不可定稿 / 待澄清`。
- 验收标准：文本和 JSON 都能表达来源与状态；纯文本不依赖 emoji 也能读清。
- 不做/边界：不破坏机器可解析输出。

## 完成同步规则

- 每完成一个功能批次，新增 `changes/YYYY-MM-DD-*.md`。
- 代码变更至少运行相关单测和 `npm run build`。
- CLI 命令变化同步 README 的真实可用命令，必要时更新 smoke 测试。
- 完成整条路线后归档到 `docs/tech/todo-archive.md`，并从 `todo-index.md` 移除。
