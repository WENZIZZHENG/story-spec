---
change_type: minor
scope: review,presets,cli,docs,tests,openspec,todo
---

# Reviewer 权重接入

## CLI 行为

- `storyspec review --json` 的每个 reviewer 现在包含 `weight` 和 `weightSource`。
- 权重来源优先级为项目级 `spec/reviewer-config.json`、active preset manifest、默认值。
- 未配置时权重为 `1`，默认分数保持旧公式。

## 模板契约

- 复用已存在的 preset manifest `reviewerWeights` 字段，不新增 schema。
- 项目级配置读取 `spec/reviewer-config.json` 的 `reviewerWeights` 对象；非数字值会被忽略并回落默认。
- 权重只影响审稿分数强度和展示优先级，不改变 finding 归属、不自动修改正文。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- 已安装 preset 的 `spec/reviewer-config.json` 可以作为项目级覆盖配置。

## 验证

- `openspec validate apply-reviewer-weights --strict --json --no-interactive`
- `npx vitest run tests/unit/review-project.test.ts`
