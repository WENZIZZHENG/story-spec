# 插件、扩展与预设入口决策

## 状态

Accepted

## 背景

A5 已经把插件、扩展、预设收敛到同一个底座：

- `PluginManifest.kind` 可区分 `extension`、`preset`、`style-pack`、`market-bridge`。
- 插件命令先归一为 command source，再由 agent renderer 输出。
- template resolution stack 已能诊断 project override / preset / extension / core 的最终来源。
- `plugins:add --dry-run` 已显示对所有 agent integration 的影响。

接下来需要决定是否立即新增 `preset:add`、`extension:add`，或继续复用 `plugins:add`。

## 决策

当前阶段继续复用 `plugins:add` 作为唯一安装入口，不在 A5 新增 `preset:add` 或 `extension:add`。

原因：

- A5 的主要交付物是统一底座和诊断能力，不是扩张 CLI 命令面。
- `PluginManifest.kind` 已足以表达安装包语义，CLI 可以在展示层按 kind 显示 preset / extension / style-pack。
- 立即新增多个入口会增加 help、smoke、文档和兼容说明成本，但底层安装行为仍相同，用户收益有限。
- B8 已规划 `preset:list`、`preset:add`、`preset:doctor`，应在类型 preset 包真正成型后再提供领域化入口。

## 后续策略

- `plugins:add <name>` 保持为兼容且通用的安装入口。
- 未来可以新增 `extension:add <name>` 和 `preset:add <name>` 作为薄 alias，但它们应复用同一个 install plan 和 dry-run renderer。
- 当新增 alias 时，错误提示和 dry-run 输出必须继续显示 manifest kind、agent impact、冲突路径和最终来源诊断。
- 文档先使用“插件包 / preset 包 / extension 包”描述能力，避免把尚未实现的 alias 写成可用命令。

## 非目标

- 本次不新增 Commander 子命令。
- 本次不改变 `plugins:add` 的真实安装行为。
- 本次不实现 preset registry、preset marketplace 或 `preset:list`。

## 验收

- A5 路线图与本 ADR 一致。
- 架构文档明确当前推荐入口仍是 `plugins:add`。
- `git diff --check` 通过。
