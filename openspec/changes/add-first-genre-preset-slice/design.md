## 设计

首个新增类型 preset 选择 `mystery`。它的价值边界清晰：提供推理/悬疑写作的约束、检查重点和模板，但不替作者决定凶手、真相或案件答案。

## 文件树

新增：

- `presets/mystery/preset.yaml`
- `presets/mystery/README.md`
- `presets/mystery/commands/specify.md`
- `presets/mystery/commands/plan.md`
- `presets/mystery/commands/tasks.md`
- `presets/mystery/spec/world/mystery.yaml`
- `presets/mystery/spec/reviewer-config.json`

安装仍使用现有 `addPreset`：

- 复制完整 preset 到 `.specify/presets/mystery/`。
- 写入 `spec/presets/current-preset.json`。
- 只把缺失的 `presets/mystery/spec/**` 模板复制到项目 `spec/**`，依赖现有 `overwrite: false` 保护作者内容。

## Manifest 口径

`mystery` manifest 必须包含：

- `requiredWorldFacts`：至少包含线索规则、公平性边界、嫌疑关系。
- `characterRoles`：侦探/调查者、嫌疑人、受害者/缺席核心、真相守门人等功能位。
- `pacingTemplates`：线索投放、误导、反转、揭示节奏。
- `commonMistakes`：线索不公平、误导无回收、真相硬转等。
- `reviewerWeights`：提高 continuity、reader、editor 对线索公平性和可读性的权重。

## 安全边界

- 不新增 `PresetManifest` schema 字段。
- 不修改 `manage-presets.ts` 的复制策略。
- 不覆盖作者已有正文、世界观或正典。
- 不把 preset 文案写成“自动生成谜案”。

## 非目标

- 不一次性新增 `court-intrigue`、`urban-fantasy`、`romance-slow-burn`。
- 不接入 reviewer 权重运行时评分；该任务由后续 P1-2 处理。
- 不新增类型包 marketplace 或下载能力。
