# 推理悬疑 Preset

这个 preset 为推理、悬疑、案件调查故事提供第一版结构约束。

核心用途：

- 约束线索逻辑、公平性边界和嫌疑关系。
- 提供调查者、核心嫌疑人、受害者或缺席核心、真相守门人等角色功能位。
- 让 `/specify`、`/plan`、`/tasks` 在规划时读取类型规则。
- 让 `storyspec validate` 检查必填 WorldFact。

安装后不会覆盖正文，只会写入 `.specify/presets/mystery/`、`spec/presets/current-preset.json` 和缺失的 `spec/world/*` 模板。

不适用场景：

- 不负责自动生成谜案答案。
- 不替作者决定凶手、受害者、核心诡计或最终反转。
- 不把线索公平性当成固定公式；它只提供检查边界。
