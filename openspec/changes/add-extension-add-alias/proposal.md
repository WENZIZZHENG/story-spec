## Why

StorySpec 已有 `plugins:add` 作为通用生态包安装入口，但路线图和 ADR 都保留了 `extension:add <name>` 作为语义化薄 alias 的后续能力。现在插件安装计划、dry-run renderer 和 manifest kind 已经稳定，可以补齐这个入口，同时避免复制安装逻辑。

## What Changes

- 新增 `storyspec extension:add <name>`，复用 `plugins:add` 的 resolve、install plan、dry-run renderer、conflict 和 apply 行为。
- dry-run 输出补充 manifest kind，让用户能看到当前包是 `extension`、`preset`、`style-pack` 还是其他 kind。
- `extension:add --help` 可用，CLI help 展示该入口。
- 文档只描述已实现 alias，不引入 marketplace 或远程 registry。

## Impact

影响插件 CLI 注册、安装展示文案、smoke 测试、命令文档、changeset 和生态路线状态。安装行为仍由 `PluginManager` 和同一 install plan 决定。

## Capabilities

- `cli-extension-add`
