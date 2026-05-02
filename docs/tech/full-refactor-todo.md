# Novel Writer 全面重构待办

## 状态

Draft，作为后续重构开发的路线图。执行每个阶段前，需要重新确认工作区干净、运行对应基线验证，并按本文件的任务顺序推进。

## 目标

把 Novel Writer 从“单体 CLI + 大模板 + 双脚本集合”的形态，重构为更适合 Codex 和多 AI agent 长期维护的产品级架构：

- CLI 命令薄、可测试、可组合。
- AI 平台适配、prompt 编译、项目模板、运行脚本各自有清晰边界。
- 小说创作领域模型可被类型系统、测试和验证脚本约束。
- 模板和命令支持 preset、extension、project-local override。
- 后续新增 AI 平台、写作流程、插件和追踪能力时，不再需要改多个散点。

## 非目标

- 不在第一阶段更改 slash command 的用户可见命名。
- 不删除现有 Bash/PowerShell 脚本，先建立兼容层，再逐步替换。
- 不改变已生成项目的目录约定：`.specify/`、`stories/`、`spec/` 继续保留。
- 不把成人向、高风险题材的正文生成策略写死在程序里；只在计划、任务和验证层保留边界字段。

## 当前痛点

| 区域 | 现状 | 风险 |
|------|------|------|
| CLI | `src/cli.ts` 约 1247 行，包含 init、plugins、upgrade、help、备份、复制逻辑 | 难测试、难分工、改一处容易影响多处 |
| Prompt 模板 | `templates/commands/analyze.md` 约 740 行，`specify.md` 约 494 行 | prompt 难审阅，平台差异只能靠生成脚本处理 |
| 构建脚本 | `scripts/build/generate-commands.sh` 约 320 行，平台矩阵仍在 shell 内 | 与 TS registry 分离，平台新增仍有第二处事实源 |
| 运行脚本 | Bash 与 PowerShell 逻辑并行维护 | 容易漂移，测试成本高 |
| 领域模型 | story/spec/plan/tasks/tracking 基本是文件约定 | 缺 schema，AI 写错文件结构后难发现 |
| 插件系统 | 有插件管理器，但命令、模板、知识库、追踪扩展边界不够统一 | 插件能力继续增长后会变脆 |
| 测试 | 主要靠 build 和手工 smoke | 重构缺少回归保护 |

## 参考项目与启发

| 项目 | 借鉴点 | 对 Novel Writer 的落地 |
|------|--------|------------------------|
| [github/spec-kit](https://github.com/github/spec-kit) | SDD 命令、AI integrations、preset/extension/project-local override 分层 | 把 prompt、模板、平台集成做成可解析的 registry，不靠散落复制逻辑 |
| [tj/commander.js](https://github.com/tj/commander.js) | Commander 支持 `.command()`、`.addCommand()` 和独立 executable subcommands | 保留 commander，但把每个命令拆到 `src/commands/*` |
| [oclif/core](https://github.com/oclif/core) | 复杂 CLI 使用命令类、插件、hooks、测试 helper，且只加载被执行命令 | 不急于迁移 oclif，但采用“命令模块薄入口 + use case”结构 |
| [eslint/eslint](https://github.com/eslint/eslint) | core 与 plugin/rule 分离，运行时可扩展 | 把写作规则、世界观检查、任务校验做成可注册 rule/checker |
| [nrwl/nx](https://github.com/nrwl/nx) | project graph、affected-only、插件发现、AI-native tooling | 为故事、任务、追踪文件建立 artifact graph，支持只验证受影响章节 |
| [changesets/changesets](https://github.com/changesets/changesets) | 每个变化记录版本类型和 changelog 信息，不是所有变化都要求 changeset | 建立轻量 change record：CLI 行为、模板契约、生成产物变化才要求记录 |
| [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | workspace/projects、coverage、type-level testing、ESM-first | 引入 Vitest，覆盖 registry、project IO、prompt compiler、CLI smoke |

## 归档 skills 采用

- `software-architecture`：按 Clean Architecture/DDD 拆分 CLI、domain、infra、presentation。
- `spec-driven-development`：本文件作为后续重构的 spec → plan → tasks 起点。
- `source-driven-development`：涉及 Commander、测试框架、发布工具时以官方文档或知名项目源码为准。
- `architecture-decision-records`：每个架构拐点新增 `docs/tech/*.md` 记录。
- `typescript-pro`：先建 typed contract，再改实现。
- `simplify-code`：每阶段优先高置信、行为保持的简化。
- `verification-before-completion`：每次阶段完成前必须重新运行验证命令。
- `technical-change-tracker`：后续长线重构可建立结构化 change tracker，避免会话断点丢失。

## 目标架构

```text
src/
  cli/
    program.ts                 # commander program wiring
    commands/
      init.command.ts
      upgrade.command.ts
      codex-status.command.ts
      plugins.command.ts
      info.command.ts
  application/
    init-project.ts            # use case
    upgrade-project.ts
    install-plugin.ts
    get-codex-status.ts
  domain/
    ai-platform.ts
    story-artifact.ts
    writing-task.ts
    tracking-rule.ts
    plugin-manifest.ts
  infrastructure/
    filesystem-project-store.ts
    prompt-template-store.ts
    shell-script-runner.ts
    git-adapter.ts
  prompt/
    compiler.ts
    frontmatter.ts
    platform-renderers/
  templates/
    resolver.ts                # core/preset/extension/project override
  validation/
    artifact-graph.ts
    schema/
    rules/
```

## 阶段 0：建立重构保护网

目标：在大拆分前先让行为有测试锚点。

- [x] 新增 Vitest 或同等级测试框架
  - 验收：`npm test` 可运行，至少包含 registry 与路径工具测试。
  - 文件：`package.json`、`vitest.config.ts`、`tests/**`。
  - 验证：`npm run build`、`npm test`。
- [x] 建立 CLI smoke fixture
  - 验收：测试可在临时目录执行 `init --ai codex --no-git`、`init --all --no-git`、`codex-status --json`。
  - 文件：`tests/cli-smoke.test.ts`。
  - 验证：`npm test -- cli-smoke`。
- [x] 记录 golden output
  - 验收：关键生成目录、prompt 数量、AGENTS.md 生成行为有快照或断言。
  - 文件：`tests/fixtures/`。
- [x] 加入 `npm run verify`
  - 验收：统一运行 build、测试、命令生成、smoke。
  - 文件：`package.json`。

阶段备注：

- 已新增 `tests/unit/ai-platforms.test.ts` 覆盖 AI platform registry。
- 已新增 `tests/unit/project.test.ts` 覆盖项目根目录查找和 AI 配置检测。
- 已新增 `tests/smoke/cli-init.test.ts` 覆盖 `init --ai codex` 与 `init --all`。
- 已新增 `tests/fixtures/cli-init-golden.json` 固化 Codex prompt 数量、关键输出、关键文件和全平台目录。
- 本机没有 `bun` 可执行文件，因此本轮未刷新 `bun.lock`；已用 `npm install --package-lock=false --ignore-scripts` 安装依赖且未生成 `package-lock.json`。

## 阶段 1：CLI 拆分为命令模块

目标：把 `src/cli.ts` 从 1000+ 行降到只负责 program wiring。

- [x] 新建 `src/cli/program.ts`
  - 验收：`dist/cli.js` 只导入并运行 program。
  - 验证：`node dist/cli.js --help`。
- [x] 拆 `init` 为 `src/cli/commands/init.command.ts`
  - 验收：`init --ai codex`、`init --all` 行为与阶段 0 smoke 一致。
  - 依赖：阶段 0。
- [x] 拆 `upgrade` 为 `src/cli/commands/upgrade.command.ts`
  - 验收：`upgrade --dry-run` 和现有输出一致，备份逻辑不丢。
- [x] 拆插件命令为 `plugins.command.ts`
  - 验收：`plugins:list/add/remove` 不改变命令名。
- [x] 保留兼容导出
  - 验收：package bin 仍指向 `dist/cli.js`。

阶段备注：

- 已新增 `src/cli/commands/check-status.command.ts`、`plugins.command.ts`、`upgrade.command.ts`、`info.command.ts`，让 `src/cli/program.ts` 仅负责 program wiring、banner、帮助扩展和注册命令。
- 已新增 `tests/smoke/cli-commands.test.ts` 覆盖 help、info、plugins help、`upgrade --dry-run`。

## 阶段 2：应用层 use case 化

目标：CLI 不直接做文件复制、Git 初始化、模板替换。

- [x] 新建 `application/init-project.ts`
  - 输入：项目名、路径、目标平台、写作方法、插件、git/expert 选项。
  - 输出：结构化 `InitProjectResult`。
  - 验收：CLI action 只负责解析参数和打印结果。
- [x] 新建 `application/upgrade-project.ts`
  - 验收：备份、dry-run、选择性更新可测试。
- [x] 新建 `application/get-project-status.ts`
  - 验收：`codex-status` 和后续通用 `status` 共用状态模型。
- [x] 所有 use case 仅依赖接口，不直接依赖 `fs-extra`
  - 验收：单元测试可用内存 fake store。

阶段备注：

- 已新增 `src/application/init-project.ts`，把 `init` 的项目目录创建、模板复制、插件安装和 Git 初始化移入 application 层。
- 已新增 `tests/unit/init-project.test.ts` 直接覆盖 use case 的 Codex 项目生成和已存在目录错误。
- 已新增 `src/application/upgrade-project.ts`，把 `upgrade` 的项目检测、平台选择、备份、选择性更新、dry-run 和版本写回移入 application 层。
- 已新增 `tests/unit/upgrade-project.test.ts` 覆盖 dry-run 不落盘、选择性更新、备份、用户 `spec/tracking` 与 `spec/knowledge` 保护，以及非项目目录错误。
- 已新增 `src/application/get-project-status.ts`，提供通用 `ProjectStatus` 状态模型；`codex-status` CLI 改为调用 application 层，旧 `utils/codex-status.ts` 保留兼容导出。
- 已新增 `tests/unit/get-project-status.test.ts` 覆盖项目摘要、Codex 接手文件、故事进度、追踪 JSON 与渲染输出。
- 已新增 `src/application/project-ports.ts`，定义 `ProjectFileSystem`、`GitAdapter`、`PluginInstaller` 端口。
- 已新增 `src/infrastructure/node-file-system.ts`、`command-git-adapter.ts`、`plugin-manager-installer.ts`，由 CLI 注入 Node/fs-extra/Git/插件管理器实现。
- 已新增 `tests/helpers/memory-file-system.ts`，并在 `get-project-status` 单元测试中用内存 fake store 覆盖 application 层无真实文件系统依赖的路径。

## 阶段 3：项目 artifact graph

目标：让故事规格、计划、任务、正文、追踪数据之间有可验证关系。

- [x] 定义 `StoryArtifact`、`StoryProject`、`WritingTask` 类型
  - 验收：`tasks.md` 中的输出路径、依赖、状态可解析。
- [ ] 新增 artifact scanner
  - 验收：可扫描 `stories/*`、`spec/tracking/*.json`，返回缺失、过期、非法状态。
- [ ] 新增 artifact graph
  - 验收：能回答“哪个章节受哪个任务/线索/角色状态影响”。
- [ ] `codex-status` 改用 graph
  - 验收：输出不回退，并新增阻塞原因列表。

阶段备注：

- 已新增 `src/domain/story-artifact.ts`，定义 `StoryArtifact`、`StoryProject`、`WritingTask`、任务状态/优先级等领域类型。
- 已新增 `parseWritingTasksFromMarkdown`，可解析 `tasks.md` 中的任务状态、优先级、`WRITE-READY`/`PLAN-ONLY` 标记、依赖、输出路径、必须读取、允许修改、涉及线索和验收标准。
- 已新增 `tests/unit/story-artifact.test.ts`，用接近真实任务模板的 Markdown 片段覆盖任务元数据解析。

## 阶段 4：模板与 prompt compiler 体系

目标：把 shell 中的 prompt 生成逻辑迁移到 TypeScript，减少平台漂移。

- [x] 新建 `prompt/frontmatter.ts`
  - 验收：可解析 `templates/commands/*.md` 的 description、argument-hint、scripts。
- [x] 新建 `prompt/compiler.ts`
  - 验收：输入 command template + platform config，输出目标 prompt 文件内容。
- [x] 为 Claude/Gemini/Codex 等平台建 renderer
  - 验收：生成结果与现有 `build:commands` golden fixture 等价。
- [x] `scripts/build/generate-commands.sh` 降级为兼容包装或移除
  - 验收：Windows 无 Git Bash 时仍可生成命令。
- [x] 支持模板 resolution stack
  - 顺序：project-local overrides → presets → extensions → core templates。
  - 验收：覆盖规则有测试。

阶段备注：

- 已新增 `src/prompt/frontmatter.ts`，解析命令模板 frontmatter、正文、`description`、`argument-hint`、`allowed-tools`、`model` 与 `scripts`。
- 已新增 `tests/unit/frontmatter.test.ts`，覆盖纯函数解析、无 frontmatter 模板，以及仓库内所有 `templates/commands/*.md` 的 `sh/ps` 脚本元数据。
- 解析器采用轻量行解析以兼容当前模板中未加引号的 `argument-hint`，后续 compiler 可在此基础上逐步收紧模板格式。
- 已新增 `src/prompt/compiler.ts`，支持脚本变体选择、`{SCRIPT}` 替换、`$ARGUMENTS/{ARGS}` 替换、`__AGENT__` 替换、`.specify` 路径重写，以及 full/partial/minimal/none Markdown 与 TOML 输出。
- 已新增 `tests/unit/prompt-compiler.test.ts`，覆盖核心替换规则、Markdown/TOML 输出分支，并用真实 `templates/commands/plan.md` 做轻量编译验证。
- 已新增 `src/prompt/platform-renderers/index.ts`，把每个 AI 平台的输出扩展名、命名空间、参数占位符和输出格式集中到 typed renderer registry。
- 已新增 `tests/unit/platform-renderers.test.ts`，覆盖 registry 与 `AI_PLATFORM_IDS` 一致，并验证 Claude/Gemini/Codex 的代表性输出约定。
- 已新增 `src/prompt/build-commands.ts` 与 `scripts/build/build-commands.ts`，把命令产物生成、支持文件复制、平台输出目录映射迁移到 TypeScript/Node。
- 已将 `scripts/build-commands.cjs` 改为 Node 入口，`scripts/build/generate-commands.sh` 降级为兼容包装；Windows 无 Git Bash 时可直接运行 `npm run build:commands`。
- 已新增 `tests/unit/build-commands.test.ts`，覆盖 Codex/Gemini 命令生成、脚本路径重写、支持文件复制和 `spec/tracking`/`spec/knowledge` 空目录保护。
- 已新增 `src/templates/resolver.ts`，支持 core、extension、preset、project-local 四层模板源解析，并返回最终模板清单与 override 记录。
- 已新增 `tests/unit/template-resolver.test.ts`，覆盖 project → preset → extension → core 的覆盖优先级，以及解析结果写入目标目录。

## 阶段 5：脚本运行时统一

目标：解决 Bash/PowerShell 双维护。

- [x] 盘点所有脚本功能
  - 输出：`docs/tech/script-inventory.md`。
- [ ] 抽象 script runner
  - 验收：JS/TS 层能调用 `analyze-story`、`check-writing-state` 等能力。
- [ ] 优先迁移纯文件扫描脚本到 TypeScript
  - 候选：word count、state scan、tracking JSON validation。
- [ ] 保留 shell compatibility layer
  - 验收：旧 prompt 中脚本路径仍能工作。

## 阶段 6：插件与扩展系统重构

目标：让插件不只是文件复制，而是声明式能力包。

- [ ] 定义 `PluginManifest`
  - 字段：commands、templates、knowledge、trackingRules、experts、hooks。
- [ ] 插件安装改为 plan/apply 两阶段
  - 验收：dry-run 可列出将写入的文件和冲突。
- [ ] 引入 hook 点
  - 候选：init 后、prompt compile 前、tasks 生成后、write 前验证。
- [ ] 插件冲突策略
  - 验收：同名 command/template 冲突有优先级和错误提示。

## 阶段 7：schema 与规则验证

目标：把“AI 应该写对”变成“程序能检查”。

- [ ] 引入 JSON schema 或 Zod
  - 对象：tracking JSON、plugin manifest、AI platform registry、task metadata。
- [ ] 新增 `novel validate`
  - 验收：检查项目结构、tracking JSON、任务字段、模板缺失。
- [ ] 写作规则 checker 化
  - 候选：角色称呼、时间线、世界观、任务依赖、章节字数。
- [ ] 支持 severity
  - 级别：error、warning、info。

## 阶段 8：测试与 CI

目标：后续重构能持续安全。

- [ ] GitHub Actions
  - 验收：PR 上运行 install、build、test、build:commands。
- [ ] CLI e2e matrix
  - 平台：Windows、Ubuntu；Node LTS。
- [ ] 生成产物一致性检查
  - 验收：prompt compiler 输出变化必须显式提交。
- [ ] 覆盖率门槛
  - 初始建议：核心模块 60%，后续提升。

## 阶段 9：文档与发布治理

目标：重构完成后外部用户仍能清楚升级。

- [ ] 新增 `docs/architecture.md` 或更新现有架构图
  - 验收：模块边界、数据流、extension flow 可视化。
- [ ] 引入 changeset 风格变更记录
  - 验收：CLI 行为、模板契约、生成产物变化都有记录。
- [ ] 更新 README 快速路径
  - 验收：新用户仍可 5 分钟 init + status + prompt。
- [ ] 编写迁移指南
  - 验收：旧项目如何 `upgrade`、如何保留自定义模板。

## 阶段 10：Codex 专项增强

目标：让 Novel Writer 成为 Codex 友好的长篇创作工作台。

- [ ] `novel status` 泛化，`codex-status` 作为别名
  - 验收：Codex 与其他 AI 用户都能用同一状态入口。
- [ ] `AGENTS.md` 生成可配置
  - 验收：可按成人向、慢热、冒险、恋爱、多线叙事生成不同边界模板。
- [ ] 任务到 issue / task board
  - 借鉴 Spec Kit 的 task-to-issues 思路。
  - 验收：`tasks.md` 可转为 GitHub issues 或本地 JSON board。
- [ ] 断点续写上下文包
  - 验收：生成 `handoff.md`，包含当前章节、未完成任务、必须读取文件、风险边界。

## 执行顺序

1. 阶段 0：测试保护网。
2. 阶段 1：CLI 拆分。
3. 阶段 2：应用层 use case。
4. 阶段 4：prompt compiler。
5. 阶段 3：artifact graph。
6. 阶段 7：schema 与 validate。
7. 阶段 5：脚本运行时迁移。
8. 阶段 6：插件系统。
9. 阶段 8：CI。
10. 阶段 9、10：文档发布与 Codex 增强。

说明：阶段 3 和阶段 4 可以互换，但建议先做 prompt compiler，因为它会减少后续平台相关变更成本。

## 每阶段完成定义

- [ ] 有明确设计记录或更新本文件。
- [ ] 代码改动不混入无关重构。
- [ ] `npm run build` 通过。
- [ ] 与阶段相关的测试通过。
- [ ] `npm run build:commands` 在涉及 prompt/platform 时通过。
- [ ] 至少一个临时项目 smoke 通过。
- [ ] 本地 commit 已创建，不主动 push。

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 重构范围过大导致长期半成品 | 每阶段可独立提交，保留兼容层 |
| 生成 prompt 行为漂移 | 先建立 golden fixture，再替换 compiler |
| 旧项目 upgrade 破坏用户数据 | plan/apply + backup + overwrite policy 测试 |
| Bash/PowerShell 迁移遗漏 | 脚本 inventory 后按功能逐个迁移 |
| 模板系统过度设计 | 先支持 core + project override，再扩 preset/extension |
| AI agent 误写正文或越界 | AGENTS、tasks metadata、validate 三层约束 |

## 第一批建议任务

- [x] T001：引入 Vitest，并为 `src/utils/ai-platforms.ts` 写 registry 测试。
- [x] T002：写 CLI smoke 测试，覆盖 `init --ai codex` 与 `init --all`。
- [x] T003：拆出 `src/cli/program.ts`，保持 `src/cli.ts` 为最小 bin 入口。
- [x] T004：拆出 `init.command.ts`，但暂不改 init 内部业务逻辑。
- [x] T005：为当前 `build:commands` 生成结果建立 golden fixture。
- [x] T006：新增 `docs/tech/script-inventory.md`，盘点 Bash/PowerShell 对应关系。

## 参考链接

- Spec Kit：<https://github.com/github/spec-kit>
- Spec Kit integrations：<https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md>
- Spec Kit presets：<https://github.com/github/spec-kit/blob/main/presets/README.md>
- Commander.js：<https://github.com/tj/commander.js>
- oclif/core：<https://github.com/oclif/core>
- ESLint：<https://github.com/eslint/eslint>
- Nx：<https://github.com/nrwl/nx>
- Changesets：<https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md>
- Vitest：<https://github.com/vitest-dev/vitest>
