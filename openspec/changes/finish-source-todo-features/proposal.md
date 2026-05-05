## Why

当前活跃待办基本已进入 OpenSpec 实现收尾，但源码中仍保留 3 个真实 TODO：插件核心版本依赖未比较、无 source 时插件安装只提示远程未实现、`check-world.sh` 地点引用检查永远通过。这些 TODO 会让插件安全安装和世界观检查的结果不可信。

## What Changes

- 插件安装在读取 manifest 后校验 `dependencies.core`，支持常用 semver 比较表达式，并在不满足时阻止安装。
- `plugins:add` 支持用内置插件名、插件目录路径或 `file://` 本地 URL 作为安装源；不再把所有非内置名称都当作未找到。
- 世界观检查脚本从 `locations.md` 的二级标题提取已定义地点，并检查正文中显式地点标记是否有定义。

## Impact

影响 `PluginManager` 安装路径、插件 CLI 安装入口、world check 脚本、命令生成产物与对应测试。远程 HTTP(S) 注册中心仍不在本次默认实现范围内，避免引入网络安装风险；先提供可审计的本地路径和 `file://` 安装。
