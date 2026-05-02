---
change_type: minor
scope: cli,prompt,validation,plugins,ci
---

# 重构基础设施收口

本记录汇总本轮 full-refactor 阶段性落地的用户可见契约，供发布说明和升级指南复用。

## CLI 行为

- `novel validate` 现在提供项目结构、tracking JSON、任务元数据和写作规则的统一校验入口，并支持 `--json` 与 `--severity error|warning|info`。
- `novel init --ai codex --agents-profile <profiles>` 可生成带写作边界画像的 `AGENTS.md`，支持 `adult`、`slow-burn`、`adventure`、`romance`、`multi-thread` 组合。
- `novel tasks:board` 可将 `stories/*/tasks.md` 导出为本地 `task-board.json`，并在 JSON 中包含 GitHub issue 草稿字段。
- `novel plugins add <name>` 支持 `--dry-run` 预览安装计划，默认阻止覆盖冲突；需要覆盖时必须显式使用 `--force`。
- `novel codex-status` 继续保留 Codex 接手状态摘要，并接入 artifact graph blocker。
- `npm run verify` 现在覆盖 build、unit tests、coverage、变更记录、命令产物 manifest、命令生成和 smoke tests。

## 模板契约

- 命令模板由 TypeScript prompt compiler 解析 frontmatter，并通过平台 renderer registry 输出不同 AI 平台格式。
- 模板 resolution stack 固定为 project-local overrides 优先，其次 preset、extension、core templates。
- 插件 manifest 统一声明 `commands`、`templates`、`knowledge`、`trackingRules`、`experts`、`hooks`，安装逻辑以 manifest 为准。
- shell/PowerShell 脚本路径继续保留为兼容入口，核心写作状态扫描迁移到 TypeScript runtime。

## 生成产物

- 多平台命令产物由 `src/prompt/build-commands.ts` 生成，旧 shell 生成脚本仅作为兼容包装。
- `tests/fixtures/command-artifacts.manifest.json` 记录命令生成结果 hash；prompt/compiler 输出变化必须运行 `npm run update:command-manifest` 并提交 manifest。
- runtime bundle 会随命令产物复制到 `.specify/scripts/runtime/`，保证已生成项目中的旧脚本入口仍能工作。

## 验证

- 已通过 `npm run verify`。
- 覆盖率门槛使用 `@vitest/coverage-v8`，核心源码 statements/branches/functions/lines 均要求不低于 60%。
- CI 在 Ubuntu/Windows 与 Node 20/22 矩阵上运行同一条 `npm run verify`。
