# Agent、CI 与自然语言质量增强路线图

## 状态

Active。本文登记新增 agent integration / renderer、CI 化质量检查和 Vale / textlint 等自然语言 lint 接入的未来增强。

## 背景和目标

StorySpec 已完成 agent-neutral 基座，支持多种 agent integration 和 Markdown 命令产物。归档路线仍保留新增 agent integration、命令渲染能力、CI 化质量检查和自然语言 lint 外部工具接入等方向。目标是把这些质量与适配增强集中管理。

## 非目标

- 不把 StorySpec 变成运行 LLM 的自动写作引擎。
- 不强制用户安装 Vale、textlint 或任意外部工具。
- 不为新 agent 破坏既有 renderer 和 manifest 稳定性。
- 不把 CI 检查结果自动改写故事正文。

## P0 Agent 适配扩展

### P0-1 新 agent integration / renderer 增强批次

- [x] 状态：完成（2026-05-05）。已新增 agent integration 准入清单和可复用 acceptance 检查器；当前 registry 全量通过 metadata、install target、renderer、slashPrefix 和 legacy 映射检查。文档见 `docs/tech/agent-integration-acceptance.md`，验证见 OpenSpec `openspec/changes/define-agent-integration-acceptance` 和 changeset `changes/2026-05-05-agent-integration-acceptance.md`。
- 类型：agent integration、命令渲染、兼容性
- 背景/问题：Agent-neutral 路线完成后，后续新增 agent integration 或命令渲染能力需要独立增强批次推进。
- 已有基础：`src/agent/registry.ts`、renderer、`templates/commands/*.md`、命令 manifest、smoke。
- 缺口：缺少新增 integration 的准入清单、能力分级测试和文档同步模板。
- 建议方案：定义新增 agent 的最小验收：registry 元数据、安装目录、renderer、命令产物、doctor、init/upgrade smoke、manifest 更新、README/docs 同步。
- 下一次开发入口：新建 OpenSpec change `define-agent-integration-acceptance`，第一版先交付准入清单和测试 scaffold，不新增具体 agent；若要同步新增 agent，必须把 agent id、安装目录和 renderer 差异写入 change。
- 涉及文件/模块：`src/agent/registry.ts`、`src/agent/renderers/`、`scripts/build-commands.cjs`、`tests/unit/agent-registry.test.ts`、`tests/unit/platform-renderers.test.ts`、`tests/smoke/cli-init.test.ts`。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-agent-neutral.md`。
- OpenSpec 输入：`proposal.md` 写清“准入清单”是否为文档-only；`design.md` 列出每个 agent integration 必须覆盖的字段、renderer fixture、manifest hash、doctor 输出和 init/upgrade smoke；`tasks.md` 把“新增 agent”和“完善准入检查”拆成独立任务。
- 验收标准：新增或增强的 agent 能通过 init、upgrade、doctor、manifest 和 smoke；文档不承诺未实现能力；legacy `--ai` 兼容层不被破坏。
- 验收命令：`npm run build`、`npx vitest run tests/unit/agent-registry.test.ts tests/unit/platform-renderers.test.ts`、相关 CLI smoke、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check`。
- 不做/边界：不删除现有 agent，不迁移旧项目数据。

## P1 CI 化质量检查

### P1-1 Markdown 命令和检查能力 CI 化

- [ ] 状态：Active
- 类型：CI、质量检查、命令协议
- 背景/问题：归档路线借鉴 Continue 的 Markdown check 形态，提出命令/检查/分析能力未来可被普通 Markdown 表达并在 CI 中运行。
- 已有基础：Markdown command templates、`validate`、`check:command-manifest`、`check:changes`。
- 缺口：缺少 CI 入口、检查清单格式和失败输出约定。
- 建议方案：先定义只读 CI check manifest，再提供命令扫描、模板引用、manifest 一致性和文档边界检查；后续再接入 GitHub Actions 示例。
- 下一次开发入口：新建 OpenSpec change `add-ci-quality-checks-manifest`，第一版实现本地命令，例如 `storyspec ci:check --json` 或 npm script，读取静态 manifest 并串联现有 `check:changes`、`check:command-manifest`、文档边界检查；CI workflow 示例放在第二步。
- 涉及文件/模块：`scripts/build/`、`.github/`、`templates/commands/`、`docs/tech/`、`tests/unit/`。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-agent-neutral.md`。
- OpenSpec 输入：先冻结检查结果字段 `checkId`、`status`、`command`、`files`、`message`、`suggestedAction`；列出第一版必须只读，不运行 LLM、不联网、不修改文件。
- 验收标准：本地命令可运行 CI 化检查并输出机器可读结果；CI 示例不要求访问网络；失败时指出具体文件和修复建议。
- 验收命令：`npm run build`、新增 unit、相关 smoke 或脚本测试、`npm run check:changes`、`npm run check:command-manifest`、`git diff --check`。
- 不做/边界：不在第一版执行 LLM 或浏览器自动化。

## P2 自然语言 lint 外部工具接入

### P2-1 Vale / textlint 可选 adapter

- [ ] 状态：Active
- 类型：自然语言 lint、外部工具适配、风格质量
- 背景/问题：Workbench 路线已实现第一版 style lint，但明确保留未来接入 Vale / textlint 的设计空间。
- 已有基础：`style:lint`、`style:explain`、本地 style 规则、`tests/unit/manage-style.test.ts`。
- 缺口：缺少外部工具发现、配置映射、失败容错和 finding 合并策略。
- 建议方案：新增可选 adapter 层；检测到配置和依赖时运行外部工具，否则保持内置 lint；统一输出 `path`、`ruleId`、`evidence`、`suggestion`。
- 下一次开发入口：新建 OpenSpec change `add-optional-prose-lint-adapters`，先实现 adapter 接口和“未安装时跳过”的 dry fixture；再择一接入 Vale 或 textlint，另一个保留为后续 adapter，避免一次性引入两个工具的失败模式。
- 涉及文件/模块：`src/application/manage-style.ts`、`src/cli/commands/`、`spec/style/`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-workbench.md`；现有 `style:lint` 和 `style:explain` 内置规则输出；外部工具只作为可选 adapter，不进入必装依赖。
- OpenSpec 输入：`design.md` 写清工具发现路径、配置文件名、退出码映射、finding 去重、JSON `source` 字段和 Windows/Unix 命令兼容；`tasks.md` 必须包含“未安装外部工具时命令仍通过”的测试。
- 验收标准：未安装外部工具时命令仍可用；安装并配置后能合并外部 finding；JSON 输出保留来源；文档说明可选依赖。
- 验收命令：`npm run build`、`npx vitest run tests/unit/manage-style.test.ts`、新增 adapter unit、相关 smoke；不要把 Vale/textlint 加为必装依赖，除非 OpenSpec 明确决定。
- 不做/边界：不让外部 lint 自动修改作者文风。

## 完成同步

- 新增 agent 或 renderer 时必须运行 `npm run build:commands` 和 manifest 检查。
- CI 或外部工具行为变化新增 changeset。
- 路线完成后归档。
