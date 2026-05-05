## Why

StorySpec 已有内置 `style:lint`，但自然语言 lint 外部工具（Vale / textlint）仍只能作为未来想法存在。为了后续安全接入外部工具，需要先提供 adapter 边界：没有安装外部工具时不阻断作者；有配置和 runner 时能合并 finding；输出能说明来源。

## What Changes

- 新增 prose lint adapter 配置解析，读取 `spec/style/adapters.json`。
- `style:lint` 输出新增 `adapters` 数组，记录每个 adapter 的 `id`、`source`、`status`、`message`。
- 第一版内置 `vale` / `textlint` adapter 名称与 schema，但默认不执行外部命令；未安装或未提供 runner 时安全 skipped。
- 应用层提供可注入 runner，便于测试 adapter finding 合并；CLI 默认不注入外部 runner，因此不会强制依赖 Vale/textlint。
- finding 增加可选 `source` 字段，内置规则为 `built-in`，外部 adapter 为 `vale` 或 `textlint`。

## Impact

影响 `style:lint` 应用服务、style lint JSON 输出、单测、smoke、文档、changeset 和路线状态。不新增 npm 依赖，不自动修改正文。

## Capabilities

- `optional-prose-lint-adapters`
