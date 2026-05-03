# 创作控制权体验优化路线图

## 状态

Active。本文档记录创作控制权体验优化的开发路线。Batch D0-D3 已完成；后续按批次选择范围、补测试、更新命令产物 manifest，并在完成后归档到 [todo-archive.md](todo-archive.md)。

## 背景

Novel Writer 当前已经具备 agent-neutral 命令生成、规格/计划/任务/写作流程、World Bible、Canon Ledger、Context Pack 等基础能力。但在真实创作场景中，用户常常只会先给出题材、风格、边界和模糊愿望。如果 agent 立即生成完整宪法、规格或世界观，容易产生三个问题：

1. **创作空间被挤压**：AI 把主角、舞台、关系线和威胁形态直接定稿，用户变成验收者。
2. **隐含假设变成正典**：AI 推断没有被标记为待确认，后续计划和正文会继续放大这些假设。
3. **新用户压力变大**：用户不知道该怎样补充信息，也缺少可复制示例和分叉方向。

目标是让 Novel Writer 更像“创作访谈与结构化编辑助手”，而不是“收到一句话就自动替用户写完整设定”的生成器。

## 参考项目与可借鉴点

### GitHub Spec Kit

参考点：

- Spec Kit 将工作流拆成 `specify -> plan -> tasks -> implement`，并在计划阶段显式处理 `NEEDS CLARIFICATION`。
- 其扩展生态包含 status、plan review gate、what-if、spec validate、memory loader 等思路，说明“阶段门禁、状态可见、漂移检测”比一次性生成更重要。

可借鉴到 Novel Writer：

- 将 `[需要澄清]` 从文档标记提升为命令门禁。
- 在 `plan/tasks/write` 前验证规格是否仍有关键未决项。
- 引入 what-if/preview 类能力，先展示改动影响，再写入故事正典。

参考：

- https://github.com/github/spec-kit
- https://github.com/github/spec-kit/blob/main/templates/commands/plan.md

### Cline Plan / Act Mode

参考点：

- Cline 明确区分 Plan Mode 和 Act Mode；Plan 阶段可以探索和讨论，但不修改文件。
- 复杂任务推荐先形成共同认可的策略，再切换到执行。

可借鉴到 Novel Writer：

- 将 `/novel-specify`、`/novel-constitution`、`/novel-plan` 分为 `preview/confirm/apply` 三段。
- 对低信息量输入默认进入“澄清/预览模式”，不得直接写文件。
- 对正文写作也可支持“先出章节意图卡，再确认写正文”。

参考：

- https://cline.bot/blog/plan-smarter-code-faster-clines-plan-act-is-the-paradigm-for-agentic-coding
- https://www.mintlify.com/cline/cline/core-workflows/plan-and-act

### Cookiecutter

参考点：

- Cookiecutter 使用模板变量收集项目输入，并支持 replay 保存用户输入，后续可复用。
- 这类“问题答案上下文”可以独立于生成产物存在，便于用户逐步补全。

可借鉴到 Novel Writer：

- 为创作澄清答案建立 `spec/clarifications/*.json` 或 `stories/*/clarifications.md`。
- 支持 replay：再次执行命令时读取上次答案，允许用户修改，而不是重新从零问。
- 将“问题库 + 默认答案 + 用户选择”作为一等数据，而不是只写进自然语言规格。

参考：

- https://cookiecutter.readthedocs.io/en/stable/advanced/replay.html

### GitHub Issue Forms

参考点：

- GitHub Issue Forms 用 YAML 表单定义字段、描述、下拉、复选和 required 校验。
- 表单既能引导用户输入，也能避免自由文本遗漏关键字段。

可借鉴到 Novel Writer：

- 用 YAML/JSON 定义类型化澄清问题：`input`、`textarea`、`dropdown`、`multi-select`、`confirm`。
- 为不同题材、命令和阶段提供问题 schema。
- 标记 required/optional，并把未答 required 转为阻塞项。

参考：

- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema

### Inquirer.js / Yeoman

参考点：

- Inquirer.js 和 Yeoman generator 长期用于交互式脚手架，通过问题、选项、默认值和确认流程降低新手门槛。
- Yeoman 生态强调 `prompting` 阶段先收集输入，再写文件。

可借鉴到 Novel Writer：

- CLI 侧增加 `novel clarify` / `novel interview` 交互模式，agent 不可用时仍可收集创作输入。
- 支持问题依赖：用户选“硬规则编程施法”后，再追问运行时、错误类型、资源消耗；选“轻量隐喻”则减少技术问题。
- 在 CLI 中输出可复制 prompt，方便用户回到 Codex/Claude/Gemini 继续。

参考：

- https://github.com/SBoudrias/Inquirer.js
- https://yeoman.io/authoring/integrating-yeoman.html

## 设计原则

1. **用户确认优先于 AI 补完**：AI 可以建议，但不能把建议静默写成正典。
2. **澄清是创作过程，不是错误处理**：`[需要澄清]` 应是正常阶段产物。
3. **少写也能保存**：一句话、标签组、问题清单、角色候选都应能成为合法早期状态。
4. **示例必须分叉**：每次示例至少覆盖 2-3 种创作取向，而不是给一个“标准答案”。
5. **写入前可预览**：大影响命令默认展示差异、假设和待确认项。
6. **追踪来源**：规格、计划和任务应知道哪些内容来自用户、AI 建议或未确认推断。
7. **状态可见**：`novel status` 不只报告文件缺失，也报告创作决策缺口。

## 总体目标

### 用户体验目标

- 新用户可以只输入一句模糊创意，也能得到可选方向、问题和示例，而不是被迫接受 AI 定稿。
- 老用户可以逐步沉淀设定，随时知道哪些内容已确认、哪些是 AI 建议、哪些仍待决定。
- 长篇项目中，后续章节不会因为早期未确认假设而发生设定漂移。

### 工程目标

- 澄清数据结构化，能被 validate/status/plan/tasks/write 复用。
- 命令模板仍保持 agent-neutral，Codex、Claude、Gemini、generic markdown 等集成共享同一契约。
- 任何写入前预览和确认机制都能在不支持交互的 agent 中降级为“输出建议，不写文件”。

## 路线分期

## Batch D0：创作控制权问题模型

状态：Completed。已建立澄清问题、答案、创作决策的领域模型和 schema 校验，不接入 CLI 或命令写入流程。

目标：定义结构化澄清问题、答案、来源和确认状态的数据模型。

### 待办

- [x] 新增 `src/domain/clarification.ts`。
  - 定义 `ClarificationQuestion`。
  - 字段：`id`、`stage`、`topic`、`question`、`whyItMatters`、`type`、`required`、`options`、`exampleAnswers`、`dependsOn`。
  - `type` 支持：`text`、`textarea`、`single-choice`、`multi-choice`、`scale`、`confirm`。
- [x] 定义 `ClarificationAnswer`。
  - 字段：`questionId`、`answer`、`source`、`confidence`、`confirmed`、`createdAt`、`updatedAt`。
  - `source` 支持：`user-explicit`、`ai-suggested`、`imported`、`default`。
- [x] 定义 `CreativeDecision`。
  - 用于记录最终进入规格/计划/任务的决定。
  - 字段：`id`、`label`、`value`、`sourceAnswers`、`status`、`canonImpact`。
- [x] 新增 schema 校验。
  - 空 `question`、无效 `type`、required 但无答案等应产生 validate warning/error。
- [x] 新增 fixtures。
  - 覆盖低信息量输入。
  - 覆盖已确认答案。
  - 覆盖 AI 建议但未确认。

### 产物

- `src/domain/clarification.ts`
- `src/domain/clarification-schema.ts`
- `tests/unit/clarification.test.ts`
- 模板样例：`templates/clarification/question-set.example.yaml`

### 验收

- `npm run build` 通过。
- 新增单测覆盖 required、source、confirmed、dependsOn。
- 文档说明 source 语义，避免 AI 建议混入正典。

### 实际完成

- 新增 `ClarificationQuestion`、`ClarificationAnswer`、`CreativeDecision` 类型。
- 新增 `parseClarificationQuestionSet`、`parseClarificationAnswerSet`、`validateClarificationSession`、`validateCreativeDecisions`。
- `validateClarificationSession` 会把 required 且未确认的问题标记为 `MISSING_REQUIRED_CLARIFICATION_ANSWER`。
- `validateCreativeDecisions` 会阻止未确认的 `ai-suggested` 答案进入创作决策。
- 新增 `templates/clarification/question-set.example.yaml` 和 `tests/fixtures/clarification/*`。

### 验证记录

- `npx vitest run tests/unit/clarification.test.ts`

## Batch D1：问题库与题材 Preset

状态：Completed。已建立内置澄清问题包和问题选择器，不接入 CLI 或命令模板。

目标：建立按题材、命令阶段和创作维度组织的问题库。

### 待办

- [x] 新增 `templates/clarification/core.yaml`。
  - 通用问题：主角、舞台、目标读者、篇幅、文风、冲突、关系线、结局倾向。
- [x] 新增题材问题库。
  - `portal-fantasy.yaml`：穿越机制、回家动机、异界秩序、文明差异。
  - `magic-system.yaml`：规则硬度、失败代价、资源、禁忌、学习路径。
  - `slow-burn-romance.yaml`：关系起点、边界、误会、升温节奏、确认节点。
  - `civilization-threat.yaml`：局部异常、长线威胁形态、揭示节奏、终局代价。
  - `cozy-adventure.yaml`：轻松来源、冒险单元、团队结构、危险强度。
  - `kingdom-building-support.yaml`：建设目标、反作用力、工具边界、不要纯种田。
- [x] 新增问题选择器。
  - 根据用户输入标签匹配问题集。
  - 每次最多选择 6-10 个关键问题，避免压迫。
  - 支持 “更多问题 / 先少问 / 直接给示例”。
- [x] 每个问题至少提供 2-3 个 `exampleAnswers`。
  - 示例必须体现不同方向。
  - 示例不能只有一个 AI 推荐答案。
- [x] 在 docs 中定义题材问题库贡献规范。

### 产物

- `templates/clarification/*.yaml`
- `src/application/select-clarification-questions.ts`
- `tests/unit/select-clarification-questions.test.ts`
- `docs/tech/clarification-question-packs.md`

### 验收

- 输入“异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁”时，能选出上述多个问题包的组合问题。
- 输出问题不超过 10 个。
- 每个输出问题包含 `whyItMatters` 和至少 2 个示例。

### 实际完成

- 新增 `templates/clarification/core.yaml` 与 6 个题材问题包。
- 新增 `loadClarificationQuestionPacks` 和 `selectClarificationQuestions`。
- 默认选择最多 10 个问题，`fewer` 模式最多 6 个，`examples-only` 只返回可复制示例。
- 新增 [clarification-question-packs.md](clarification-question-packs.md) 说明问题库贡献规则。

### 验证记录

- `npx vitest run tests/unit/select-clarification-questions.test.ts`

## Batch D2：`/novel-clarify` 创作访谈升级

状态：Completed。已升级 `/novel-clarify` 的创作控制权保护，并新增澄清记录应用服务；CommandSpec 迁移与 validate/status/plan 全量接入留给后续批次。

目标：把 clarify 从“补洞命令”升级为真正的创作访谈入口。

### 待办

- [x] 修改 `templates/commands/clarify.md`。
  - 要求先展示“用户已明确 / 需要澄清 / 示例分叉”。
  - 一次最多问 6-10 个问题。
  - 每个问题解释该选择影响什么。
  - 支持用户回答“你推荐”，但推荐必须标记为 `ai-suggested`。
- [ ] 后续迁移项：新增 `clarify.prompt.md` 或迁移到 CommandSpec。
  - 明确 requiredReads、allowedWrites、risk。
  - allowedWrites 限定到 `stories/*/clarifications.md`、`stories/*/clarifications.json`、`stories/*/specification.md` 的待确认区域。
- [x] 新增澄清记录文件。
  - 建议路径：`stories/<story>/clarifications.md` 和 `stories/<story>/clarifications.json`。
  - Markdown 面向用户审阅，JSON 面向 validate/status/plan。
- [x] 支持“只记录问题，不写规格”。
  - 当用户仍在探索时，只保存问题和答案，不生成完整规格。
- [x] 增加 clarify 后的下一步建议。
  - “继续回答问题”
  - “生成 Level 1/2/3 规格”
  - “进入写入前预览”

### 产物

- `templates/commands/clarify.md`
- 可选：`templates/commands/clarify.command.yaml`
- `src/application/manage-clarifications.ts`
- `tests/unit/manage-clarifications.test.ts`

### 验收

- 用户只给方向词时，`/novel-clarify` 不写完整规格，只输出问题、示例和可保存的澄清记录。
- 用户回答问题后，澄清记录能标记哪些答案已确认。
- validate 能识别澄清记录 JSON 有效性。

### 实际完成

- 新增 `src/application/manage-clarifications.ts`，支持创建和读取 `clarifications.json` / `clarifications.md`。
- `clarifications.md` 明确分离“用户已明确”“需要澄清”“可复制示例”“AI 建议，待确认”。
- 未确认 `ai-suggested` 会被保留为待确认，不写入规格。
- `/novel-clarify` 模板要求低信息量输入时不写完整规格、不修改 `stories/*/specification.md`。
- 命令产物 manifest 已随 `/novel-clarify` 模板和 clarification 模板复制范围更新。

### 验证记录

- `npx vitest run tests/unit/manage-clarifications.test.ts tests/unit/prompt-compiler.test.ts tests/unit/build-commands.test.ts`
- `npm run build`
- `npm run build:commands`
- `npm run update:command-manifest`

## Batch D3：写入前预览与确认门禁

状态：Completed。已在 prompt compiler 层为首批高影响写入命令注入 `preview/confirm/apply` 门禁；CLI 级 `novel preview` 留给后续增强。

目标：对高影响写入命令提供 preview/confirm/apply 流程。

### 待办

- [x] 为命令模板增加统一策略：
  - `preview`：只输出拟写入内容、来源分类、待确认项。
  - `confirm`：用户确认后才写。
  - `apply`：已有确认记录时执行写入。
- [x] 先覆盖高影响命令：
  - `/novel-constitution`
  - `/novel-specify`
  - `/novel-plan`
  - `/novel-tasks`
- [x] preview 输出必须包含：
  - 拟写入文件路径。
  - 用户明确输入。
  - AI 建议内容。
  - 未决 `[需要澄清]`。
  - 可能影响到的后续文件。
- [x] 不支持交互的 agent 降级规则：
  - 默认只输出 preview。
  - 不写文件。
  - 用户下一轮明确“确认写入”后再执行。
- [x] CLI 支持：
  - `novel preview <command> [story]`
  - 或先只在 agent prompt 中实现，CLI 后续补齐。

### 产物

- prompt compiler 预览段落注入能力。
- `templates/commands/{constitution,specify,plan,tasks}.md`
- `docs/tech/write-preview-gate.md`
- 相关单测和命令 manifest。

### 验收

- `/novel-specify` 对低信息量输入不会写 `specification.md`。
- 用户补充并确认后才写入。
- 预览中 AI 建议和用户事实清晰区分。

### 实际完成

- 新增 prompt compiler 门禁注入，按命令 description 覆盖创作宪法、故事规格、创作计划和任务清单。
- 门禁要求默认只输出 preview；用户明确“确认写入”“应用预览”或 `apply` 后才写入。
- preview 必须列出拟写入文件路径、用户明确输入、AI 建议内容、未决 `[需要澄清]` 和后续影响文件。
- 未确认 `ai-suggested` 或 required 未确认答案必须作为待澄清项，不得静默进入正典。
- 新增 [write-preview-gate.md](write-preview-gate.md) 记录 prompt 层实现边界；CLI 级 `novel preview` 后续补齐。

### 验证记录

- `npx vitest run tests/unit/prompt-compiler.test.ts`
- `npm run build`
- `npm run build:commands`
- `npm run update:command-manifest`

## Batch D4：早期灵感合法状态

目标：让“一句话、标签组、问题清单、角色候选”成为合法项目状态，而不是 validate 一直催完整 plan/tasks。

### 待办

- [ ] 定义故事成熟度阶段：
  - `idea`
  - `interviewing`
  - `specified`
  - `planned`
  - `tasked`
  - `drafting`
  - `revising`
- [ ] 新增早期文件：
  - `stories/<story>/idea.md`
  - `stories/<story>/clarifications.md`
  - `stories/<story>/candidates.md`
- [ ] 修改 `get-project-status`。
  - 没有 `creative-plan.md` 不总是 warning。
  - 如果故事处于 `idea/interviewing`，提示下一步创作问题，而非缺文件。
- [ ] 修改 `validate`。
  - 按成熟度判断必需文件。
  - `idea` 阶段允许没有 specification/plan/tasks。
  - `drafting` 阶段才要求 tasks 和 tracking 完整。
- [ ] 增加 `novel status --creative`。
  - 输出创作决策缺口。
  - 输出下一步 3 个建议问题。

### 产物

- `src/domain/story-stage.ts`
- `src/application/get-project-status.ts`
- `src/application/validate-project.ts`
- `docs/tech/story-maturity-model.md`

### 验收

- 新项目只有 idea.md 时，validate 不报“缺 plan/tasks”的误导性 warning。
- status 能显示“你还没有确定主角/舞台/冲突”等创作缺口。

## Batch D5：来源追踪与 Canon 防污染

目标：把“用户明确、AI 建议、待确认”贯穿规格、计划、世界观和正典。

### 待办

- [ ] 在规格模板中加入来源标记规范。
  - `confirmedByUser`
  - `aiSuggested`
  - `needsClarification`
- [ ] 更新 WorldFact / CanonFact 写入规则。
  - AI 推断只能写入 pending 或 propagation debt。
  - 只有用户确认或已有正文证据才能进入 canon facts。
- [ ] `novel canon:check` 增加来源检查。
  - 缺 `sourcePaths` 或缺确认状态时 warning/error。
- [ ] `novel world:check` 增加 pending 检查。
- [ ] `review` 输出“可能被 AI 偷偷定稿的设定”finding。

### 产物

- `templates/commands/specify.md`
- `templates/canon/facts.json`
- `templates/world/*.yaml`
- `src/application/inspect-worldbuilding.ts`
- `src/application/review-project.ts`

### 验收

- AI 建议不能静默变成 canon。
- review 能指出“该事实未见用户确认或正文证据”。

## Batch D6：示例分叉生成器

目标：系统性生成 2-3 个不同创作方向示例，而不是模板里手写单一示例。

### 待办

- [ ] 新增 `ExampleBranch` 模型。
  - 字段：`label`、`tone`、`assumptions`、`sampleAnswer`、`tradeoffs`。
- [ ] 新增示例生成规则：
  - 每次至少包含一个“作者主导/继续提问”示例。
  - 其余示例覆盖不同风格或市场方向。
  - 每个示例都说明会带来的取舍。
- [ ] 将示例分叉接入：
  - input clarification onboarding。
  - clarify command。
  - specify command。
- [ ] 增加题材示例库。
  - 每个题材包提供 3-5 个 branch seed。

### 产物

- `src/domain/example-branch.ts`
- `templates/clarification/examples/*.yaml`
- `tests/unit/example-branch.test.ts`

### 验收

- 对同一输入能稳定生成不同风味示例。
- 示例不会把自身内容写入正典，除非用户选择或改写确认。

## Batch D7：创作状态与下一步推荐

目标：让 `novel status` 成为创作导航，而不是只做文件检查。

### 待办

- [ ] `status` 增加“创作空间”板块。
  - 已确认决策数量。
  - 待确认决策数量。
  - AI 建议未确认数量。
  - 下一步建议问题。
- [ ] `status --json` 输出结构化 creative gaps。
- [ ] `handoff` 包含创作控制权摘要。
  - 哪些内容不能擅自定稿。
  - 下一个 agent 应先问什么。
- [ ] `context:pack` 加入 clarification mustRead。

### 产物

- `src/application/get-project-status.ts`
- `src/application/generate-handoff.ts`
- `src/application/manage-context-packs.ts`
- `tests/unit/get-project-status.test.ts`

### 验收

- 新用户能从 status 看懂下一步应该回答什么。
- 续写 agent 不会绕过未确认设定。

## Batch D8：交互式 CLI 兜底

目标：当用户不想用 slash command，或当前 agent 不适合写入时，CLI 也能完成创作访谈。

### 待办

- [ ] 新增 `novel interview [story]`。
  - 从问题库选择问题。
  - 使用 Inquirer 风格的 input/list/checkbox/confirm。
  - 支持跳过、稍后回答、使用示例。
- [ ] 新增 `novel clarify [story]` CLI。
  - 非 agent 环境下也能生成澄清记录。
- [ ] 支持 replay。
  - 保存到 `stories/<story>/clarifications.json`。
  - 再次运行时显示旧答案并允许修改。
- [ ] 输出 agent handoff prompt。
  - CLI 访谈后生成一段可复制到 Codex 的 `/novel-specify` 输入。

### 产物

- `src/cli/commands/interview.command.ts`
- `src/application/interview-story.ts`
- `tests/smoke/interview-cli.test.ts`

### 验收

- 在无 agent 写入能力时，用户仍能完成澄清。
- replay 能复用上一次回答。

## Batch D9：漂移检测与反向同步

目标：防止计划、任务、正文偏离用户已确认的创作意图。

### 待办

- [ ] `review` 增加创作意图 drift 检查。
  - 正文是否引入未确认设定。
  - 感情线是否跳过慢热阶段。
  - 建设流是否变成纯种田。
  - 文明威胁是否过早压垮基调。
- [ ] `analyze` 增加“创作控制权”维度。
- [ ] `tasks` 生成时追溯到已确认决策。
- [ ] `branch:create` 支持 what-if 分支，不污染 main。
- [ ] `branch:promote` 前输出创作影响报告。

### 产物

- `src/application/review-project.ts`
- `templates/commands/analyze.prompt.md`
- `templates/commands/review.md`
- `tests/unit/review-project.test.ts`

### 验收

- 能识别“AI 自行定了感情线对象”这类漂移。
- 能把漂移输出为待确认任务，而不是自动重写。

## Batch D10：文档、教程与用户引导

目标：把新流程讲清楚，让用户知道“少说一点也可以，但不会被 AI 接管”。

### 待办

- [ ] 更新 README 快速开始。
  - 从“直接 `/specify` 生成规格”改为“输入方向 -> 澄清 -> 预览 -> 写入”。
- [ ] 新增用户文档：`docs/creative-control.md`。
  - 什么是用户已明确。
  - 什么是 AI 建议。
  - 什么是待确认。
  - 如何使用示例分叉。
- [ ] 新增教程：从模糊创意到第一卷计划。
  - 示例输入：“异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。”
  - 展示正确行为：不落盘，先澄清。
- [ ] 更新 `docs/commands.md`。
- [ ] 更新 `docs/workflow.md`。
- [ ] 添加迁移说明。
  - 旧项目如何引入 clarifications。
  - 如何标记已有 AI 设定为 pending。

### 产物

- `docs/creative-control.md`
- `docs/workflow.md`
- `docs/commands.md`
- `README.md`

### 验收

- 用户文档中明确：低信息量输入不会直接生成规格。
- 所有示例都包含 2-3 个可复制分叉。

## 建议实施顺序

1. **D0 + D1**：先有问题模型和问题库，否则后续都是 prompt 文案堆叠。
2. **D2**：升级 `/novel-clarify`，让用户马上感受到创作主导权。
3. **D3**：写入前预览，解决“AI 偷偷落盘”的体验问题。
4. **D4 + D7**：状态和 validate 变友好，让早期灵感成为合法状态。
5. **D5 + D9**：来源追踪和漂移检测，保护长篇项目。
6. **D8**：CLI 交互兜底。
7. **D10**：补用户文档和教程。

## 非目标

- 不在本路线中实现正文生成质量优化。
- 不新增特定题材 preset 的完整世界观模板。
- 不引入外部数据库或远程服务。
- 不改变现有 agent integration 的安装目录。
- 不把 Novel Writer 变成 GUI 写作软件。

## 风险与缓解

| 风险 | 表现 | 缓解 |
| --- | --- | --- |
| 问题太多压迫用户 | 用户看到 20 个问题直接退出 | 每轮最多 6-10 个，支持“先少问” |
| Prompt 变长耗 token | 每个命令都塞完整问题库 | 问题选择器只加载相关 pack |
| AI 仍然替用户定稿 | 示例被写进规格 | source/confirmed 字段和预览门禁 |
| validate 过松 | 早期状态掩盖真实缺失 | 按 story maturity 区分必需项 |
| 多 agent 行为不一致 | Codex/Claude/Gemini 输出差异 | prompt compiler 注入统一契约，manifest 覆盖 |
| 结构过重 | 用户只想快速写一章 | 支持 Tiny/Idea 模式和跳过非必要阶段 |

## 验证矩阵

| 场景 | 期望 |
| --- | --- |
| 用户只输入题材标签 | 不写文件，输出已明确/待澄清/示例 |
| 用户选择示例并修改 | 保存为 user-explicit 或 user-confirmed |
| 用户说“你推荐” | 保存为 ai-suggested，进入 preview |
| story 处于 idea 阶段 | validate 不误报缺 plan/tasks |
| story 处于 drafting 阶段 | validate 要求 spec/plan/tasks/tracking 完整 |
| plan 前仍有 required 未答 | plan 命令阻塞或生成澄清任务 |
| write 前有未确认感情线 | write 命令要求确认或只写不触碰该线 |
| AI 在正文引入新设定 | review 标记为待确认 canon debt |

## 开发验收总门槛

- 每个 Batch 至少包含单测或 smoke 测试。
- 涉及 prompt/compiler 或命令模板时，运行：
  - `npm run build`
  - `npm run build:commands`
  - `npm run check:command-manifest`
  - 相关 `vitest`
- 涉及 CLI 或 validate/status 时，增加 smoke。
- 涉及用户文档时，示例必须包含至少 2-3 个可复制分叉。
- 完成 Batch 后更新本文档状态，并归档到完成记录。
