---
change_type: patch
scope: cli,docs
---

# 降低 next 默认输出信息密度

## CLI 行为

- `storyspec next` 默认改为新手精简视图，只展示当前阶段、一条可复制主命令、推荐原因、两个可选入口和当前缺口。
- 新增 `storyspec next --verbose` / `--all`，用于展开完整入口卡、作者画像、核心要素、未决项和结构问题。
- 新增 `storyspec next --modes`，用于单独展示低负担今日创作模式。
- `storyspec next --json` 保持完整结构化输出不变。

## 模板契约

- 无模板契约变化。

## 生成产物

- 无故事文件结构变化。
- CLI 文本输出的默认阅读层级调整为 progressive disclosure。

## 验证

- 新增单测覆盖默认精简视图、verbose 完整视图和 modes 今日模式视图。
