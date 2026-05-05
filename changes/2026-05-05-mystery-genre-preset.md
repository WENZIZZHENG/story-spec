---
change_type: minor
scope: presets,docs,tests,openspec,todo
---

# 推理悬疑类型 preset

## CLI 行为

- `storyspec preset:list --json` 现在可以发现内置 `mystery` genre preset。
- `storyspec preset:add mystery --json` 通过现有 preset 安装流程写入 `.specify/presets/mystery/`、`spec/presets/current-preset.json` 和缺失的 `spec/**` 模板。
- 安装后 `storyspec preset:doctor --json` 和 `storyspec validate --json` 可识别 `mystery` 的必填 WorldFact 模板。

## 模板契约

- 新增 `presets/mystery/commands/specify.md`、`commands/plan.md`、`commands/tasks.md`，用于提醒 agent 保持线索公平性、误导回收和作者确认边界。
- preset manifest 声明线索逻辑、公平性边界、嫌疑关系、角色功能位、节奏模板、常见错误和 reviewerWeights。
- 不修改 agent command 生成模板，不改变现有 slash command contract。

## 生成产物

- 新增 `presets/mystery/spec/world/mystery.yaml` 和 `presets/mystery/spec/reviewer-config.json`，作为安装到用户项目的缺省模板来源。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- 不新增模板生成产物清单项。

## 行为边界

- 不修改 preset 安装架构。
- 不覆盖作者已有正文、世界观或正典。
- 不自动生成谜案答案，不替作者决定凶手、动机、核心诡计或最终反转。

## 验证

- `openspec validate add-first-genre-preset-slice --strict --json --no-interactive`
- `npx vitest run tests/unit/preset-manifest.test.ts -t "built-in mystery preset"`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "installs and validates a genre preset"`
