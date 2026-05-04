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
- 状态：基础版已落地，preview JSON 和 `.preview.md` 会展示作者确认项、Agent 建议和待确认项。
- 背景/问题：`preview specify` 只显示风险和文件路径，作者难以判断“这次到底会写入什么”。
- 建议方案：给 `preview specify/plan` 增加摘要区，展示新增/更新项、来源、仍待确认项和风险。
- 验收标准：预览报告中出现“将写入的作者确认项 / agent 建议 / 待确认项 / 风险”。
- 不做/边界：不替代 `git diff`，只做写入前可读摘要。

### P1-2 规格文档结构与完整文本

- 类型：规格文档可读性。
- 状态：基础版已落地，`preview specify` 会输出故事圣经结构，并完整保留用户确认答案。
- 背景/问题：当前 `specification.md` 中部分确认内容被截断为 `...`，不适合当“故事圣经 v0”长期阅读。
- 建议方案：调整规格生成器，核心确认内容完整保留；按“类型与阅读承诺 / 世界观 / 社会结构矛盾 / 能力体系 / 主角与成长线 / 核心伙伴 / 第一舞台 / 第一卷冲突 / 长线伏笔 / 创作边界 / 待确认”组织。
- 验收标准：正式规格不截断作者确认答案；仍明确标注作者确认、agent 建议和待确认。
- 不做/边界：不把未确认建议提升为正典。

## P2 体验和效率

### P2-1 用户无需记忆 questionId

- 类型：输入体验。
- 状态：基础版已落地，`interview/clarify --answers` 支持常用中文别名映射。
- 背景/问题：普通作者不应记 `core.stage=...` 这类内部字段。
- 建议方案：在 `interview` 或 `ingest` 中支持别名，如 `主角=...;第一舞台=...;伙伴=...`，内部映射到 question id。
- 验收标准：中文别名能写入对应澄清字段；未知别名给出可选建议，不静默丢弃。
- 不做/边界：不改变现有 `questionId=answer` 兼容格式。

### P2-2 候选/正典可视化标记

- 类型：CLI 输出可读性。
- 状态：基础版已落地，`core`、`creative:report` 与 preview 写入摘要会显示来源/状态标记，JSON 中保留 `sourceLabel`。
- 背景/问题：作者需要一眼区分作者确认、AI 候选、不可定稿和待澄清。
- 建议方案：在核心面板、creative report 和 preview 摘要中统一标记 `作者确认 / AI 候选 / 不可定稿 / 待澄清`。
- 验收标准：文本和 JSON 都能表达来源与状态；纯文本不依赖 emoji 也能读清。
- 不做/边界：不破坏机器可解析输出。

## P3 后续储备

### P3-1 共创输入工作台交互层

- 类型：CLI 交互、产品体验。
- 背景/问题：当前已支持长文吸收、批量答案、核心面板和预览摘要，但仍主要依赖命令参数；对非命令行用户，完整链路还不够像“创作工作台”。
- 已有基础：`storyspec next`、`storyspec interview`、`storyspec ingest`、`storyspec core`、`storyspec preview` 已能覆盖主要数据流。
- 缺口：缺少一个连续入口，把“粘贴长文 -> 看拆分 -> 选择确认 -> 查看核心面板 -> 生成预览”串成低负担会话。
- 建议方案：后续新增轻量 workbench 命令或现有 `next` 模式增强，复用已实现的本地规则和确认门禁。
- 涉及文件/模块：`src/cli/commands/workbench.command.ts`、`src/application/co-creation-workbench.ts`、`src/application/ingest-story-input.ts`、README。
- 验收标准：作者可以从一个入口完成长文导入、候选确认、核心缺口查看和下一步命令选择；默认不绕过确认门禁。
- 不做/边界：不在本路线第一批引入 TUI/网页 UI，不接入 LLM 自动语义理解。

### P3-2 语义识别质量增强

- 类型：输入解析、研究储备。
- 背景/问题：`ingest` 首批使用标题和关键词规则，适合明确长文，但对自然散文、聊天式设定和混合段落识别有限。
- 已有基础：`src/application/ingest-story-input.ts` 已有明确字段识别和 dry-run/apply 门禁。
- 缺口：需要更细的段落证据、置信度说明、冲突检测和“可能属于多个字段”的候选提示。
- 建议方案：先扩展本地规则与测试语料；后续再评估是否接入可选 LLM 解析，但输出必须仍走候选/确认门禁。
- 涉及文件/模块：`src/application/ingest-story-input.ts`、`tests/unit/ingest-story-input.test.ts`、`tests/fixtures`。
- 验收标准：无标题 500 字设定能给出更合理的候选分组；低置信度内容不会自动写入 confirmed。
- 不做/边界：不承诺自动理解所有隐喻和复杂阴谋线。

## 完成同步规则

- 每完成一个功能批次，新增 `changes/YYYY-MM-DD-*.md`。
- 代码变更至少运行相关单测和 `npm run build`。
- CLI 命令变化同步 README 的真实可用命令，必要时更新 smoke 测试。
- 完成整条路线后归档到 `docs/tech/todo-archive.md`，并从 `todo-index.md` 移除。
