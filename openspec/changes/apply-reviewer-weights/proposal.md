## Why

Genre preset manifest 已能解析 `reviewerWeights`，内置 `xuanhuan-cultivation` 和 `mystery` 也都声明了权重，但 reviewer loop 目前没有使用它们。作者安装类型包后，审稿面板仍按固定扣分显示，无法体现不同题材的检查重点。

## What Changes

- reviewer loop 读取项目级 `spec/reviewer-config.json` 的 `reviewerWeights`。
- 若项目级配置不存在，则读取当前 active preset manifest 的 `reviewerWeights`。
- 未配置的 reviewer 使用默认权重 `1`，并保持当前 score 结果兼容。
- review JSON 的每个 reviewer 输出 `weight` 和 `weightSource`，说明权重来自 project、preset 或 default。
- 权重只影响 reviewer score 的扣分强度和展示，不自动修改正文、不改变 finding 分类。

## Impact

影响 `src/application/review-project.ts`、review JSON 输出、review 单测、CLI smoke、changeset 和生态路线状态。不新增 `PresetManifest` schema，不改变 preset 安装流程。

## Capabilities

- `reviewer-weights`
