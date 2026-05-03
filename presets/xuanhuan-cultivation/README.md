# 玄幻修炼 Preset

这个 preset 为玄幻、修仙、升级流提供第一版结构约束。

核心用途：

- 约束境界体系、灵力规则和势力秩序。
- 提供主角、引路人、竞争者等角色功能位。
- 让 `/specify`、`/plan`、`/tasks` 在规划时读取类型规则。
- 让 `storyspec validate` 检查必填 WorldFact。

安装后不会覆盖正文，只会写入 `.specify/presets/xuanhuan-cultivation/`、`spec/presets/current-preset.json` 和缺失的 `spec/world/*` 模板。
