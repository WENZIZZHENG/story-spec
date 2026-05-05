## 设计

本次只统一用户可见文案，不改变安装或解析逻辑。

## kind 中文名

插件 manifest kind 映射：

- `extension`：扩展包
- `preset`：预设包
- `style-pack`：风格包
- `market-bridge`：市场桥接包

未知 kind 理论上会被 manifest schema 拦截；展示函数仍回落为“生态包”，避免未来扩展时直接空白。

## 输出口径

插件/extension：

- 安装摘要显示 `包类型: 扩展包 (extension)`。
- dry-run 显示 `包类型: 扩展包 (extension)`。
- dry-run 标题 `Agent integration 影响` 调整为 `安装影响`，下方保留 agent integration 明细。
- 继续显示写入路径、冲突和 `--force` 提示。

Preset：

- `preset:list` 标题改为 `Genre Preset 类型包`。
- 每行显示 `- <id>：<name>（类型包 / <genre>）`。
- `preset:doctor` 当前 preset 行显示 `类型包` 和 genre。

## 非目标

- 不改变 `preset:list --json`、`preset:add --json`、`review --json` 等机器可读 schema。
- 不新增 marketplace。
- 不新增生态包发现服务。
