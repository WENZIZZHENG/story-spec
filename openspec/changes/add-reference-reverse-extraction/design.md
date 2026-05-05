## Context

已有 `research:*` 负责本地资料管理，`ingest` / `co:create` 负责吸收作者创作资料，`preview/apply` 负责确认后写入。参考作品反向拆解需要复用这些边界，而不是变成抓取原作、复述原文或默认续写。

## Goals / Non-Goals

**Goals:**

- 让作者能输入读后笔记、摘要或本地研究资料，得到可原创化的结构化 preview。
- 输出必须区分原作依赖项、高风险相似项、可原创化结构、新故事候选和不得照搬清单。
- 默认不写入正典，不生成原作续写正文。
- 支持 `--json`，便于 agent 和后续工具读取。

**Non-Goals:**

- 不抓取、下载或解析受保护作品全文。
- 不联网搜索参考作品。
- 不自动判断法律结论，只提供创作边界和风险提示。
- 不新增 apply 写入流程；第一版是 preview-only。

## Design

1. **应用层服务**
   - 新增 `src/application/reverse-reference.ts`。
   - 输入：`projectRoot`、`fileSystem`、可选 `story`、`--title`、`--text`、`--file`、`--mode original|fanfic-notes`。
   - 输出：`ReferenceReverseResult`，包含 source、mode、sections、boundary、written=false。

2. **结构化分区**
   - `source`: 参考标题、来源文件、输入长度。
   - `originalDependencies`: 识别到的专有名词、角色/势力/地名/术语、直接续写意图。
   - `highRiskSimilarities`: 与原作绑定过强、不能直接迁移的相似点。
   - `translatableStructures`: 类型承诺、爽点结构、关系张力、权力结构、世界压力、未完成承诺、厌恶点修复。
   - `newStoryCandidates`: 去专名后的原创候选设计方向。
   - `doNotCopy`: 固定边界清单，提醒不要照搬角色、地名、专有术语、剧情线、原文表达和未授权续写正文。

3. **CLI**
   - 新增 `src/cli/commands/reference.command.ts` 注册 `reference:reverse`。
   - `--text` / `--file` 至少提供一个。
   - `--json` 输出完整 JSON；默认 Markdown 风格文本。
   - 不提供 `--apply`，输出明确写入状态为“预览未写入”。

4. **Agent command**
   - 新增 `templates/commands/reference-reverse.command.yaml` 和 `templates/commands/reference-reverse.prompt.md`。
   - prompt 只允许处理作者提供资料，强调 candidate / preview / confirm / apply。

5. **测试**
   - Unit：应用层服务识别分区、拒绝空输入、render 文本包含安全边界。
   - Smoke：CLI JSON 输出 preview-only，且不创建 world/canon/spec 写入。
   - Command build：已有生成测试可覆盖新增 command count；必要时补断言。

## Risks / Trade-offs

- [误用成续写] -> 默认模式为原创化转译，render 和 prompt 明确“不生成原作续写正文”。
- [误把专名当候选正典] -> 专名进入 `originalDependencies` / `doNotCopy`，新故事候选使用抽象结构表述。
- [规则过于机械] -> 第一版用关键词和作者标签做启发式 preview，不声称语义完美；需要作者确认。

## Migration Plan

新版本项目可直接使用 `storyspec reference:reverse --text/--file`。旧项目升级后通过命令产物获得 agent prompt。README 只记录真实可用的 preview-only 能力。
