## Why

StorySpec 现在已有通用插件包、extension alias、genre preset 和 reviewer 权重。生态包种类增多后，CLI 输出里既有 raw `Manifest kind`，也有 `Genre Preset`，用户很难快速判断“这是哪类包、会写到哪里、影响哪些能力”。P2-1 需要统一展示口径，避免把插件、extension、preset 混成一类。

## What Changes

- 插件/extension 安装预览和安装摘要同时显示 raw kind 与中文 kind 名称。
- dry-run 输出明确“包类型”和“安装影响”，仍保留 agent impact 与冲突诊断。
- preset list / doctor 文本输出明确显示“类型包”和 genre，避免与 plugin/extension 混淆。
- 文档同步已实现口径，不引入 marketplace 或远程发现服务。

## Impact

影响插件 CLI 文案、preset 文本 renderer、CLI smoke、preset 单测、命令文档、changeset、生态路线和待办入口。不改变 JSON schema，不改变安装行为。

## Capabilities

- `ecosystem-kind-copy`
