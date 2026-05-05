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

- [ ] 状态：Active
- 类型：agent integration、命令渲染、兼容性
- 背景/问题：Agent-neutral 路线完成后，后续新增 agent integration 或命令渲染能力需要独立增强批次推进。
- 已有基础：`src/agent/registry.ts`、renderer、`templates/commands/*.md`、命令 manifest、smoke。
- 缺口：缺少新增 integration 的准入清单、能力分级测试和文档同步模板。
- 建议方案：定义新增 agent 的最小验收：registry 元数据、安装目录、renderer、命令产物、doctor、init/upgrade smoke、manifest 更新、README/docs 同步。
- 涉及文件/模块：`src/agent/registry.ts`、`src/agent/renderers/`、`scripts/build-commands.cjs`、`tests/unit/agent-registry.test.ts`、`tests/unit/platform-renderers.test.ts`、`tests/smoke/cli-init.test.ts`。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-agent-neutral.md`。
- 验收标准：新增或增强的 agent 能通过 init、upgrade、doctor、manifest 和 smoke；文档不承诺未实现能力；legacy `--ai` 兼容层不被破坏。
- 不做/边界：不删除现有 agent，不迁移旧项目数据。

## P1 CI 化质量检查

### P1-1 Markdown 命令和检查能力 CI 化

- [ ] 状态：Active
- 类型：CI、质量检查、命令协议
- 背景/问题：归档路线借鉴 Continue 的 Markdown check 形态，提出命令/检查/分析能力未来可被普通 Markdown 表达并在 CI 中运行。
- 已有基础：Markdown command templates、`validate`、`check:command-manifest`、`check:changes`。
- 缺口：缺少 CI 入口、检查清单格式和失败输出约定。
- 建议方案：先定义只读 CI check manifest，再提供命令扫描、模板引用、manifest 一致性和文档边界检查；后续再接入 GitHub Actions 示例。
- 涉及文件/模块：`scripts/build/`、`.github/`、`templates/commands/`、`docs/tech/`、`tests/unit/`。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-agent-neutral.md`。
- 验收标准：本地命令可运行 CI 化检查并输出机器可读结果；CI 示例不要求访问网络；失败时指出具体文件和修复建议。
- 不做/边界：不在第一版执行 LLM 或浏览器自动化。

## P2 自然语言 lint 外部工具接入

### P2-1 Vale / textlint 可选 adapter

- [ ] 状态：Active
- 类型：自然语言 lint、外部工具适配、风格质量
- 背景/问题：Workbench 路线已实现第一版 style lint，但明确保留未来接入 Vale / textlint 的设计空间。
- 已有基础：`style:lint`、`style:explain`、本地 style 规则、`tests/unit/manage-style.test.ts`。
- 缺口：缺少外部工具发现、配置映射、失败容错和 finding 合并策略。
- 建议方案：新增可选 adapter 层；检测到配置和依赖时运行外部工具，否则保持内置 lint；统一输出 `path`、`ruleId`、`evidence`、`suggestion`。
- 涉及文件/模块：`src/application/manage-style.ts`、`src/cli/commands/`、`spec/style/`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-workbench.md`。
- 验收标准：未安装外部工具时命令仍可用；安装并配置后能合并外部 finding；JSON 输出保留来源；文档说明可选依赖。
- 不做/边界：不让外部 lint 自动修改作者文风。

## 完成同步

- 新增 agent 或 renderer 时必须运行 `npm run build:commands` 和 manifest 检查。
- CI 或外部工具行为变化新增 changeset。
- 路线完成后归档。
