---
change_type: minor
scope: style,cli,docs,tests,openspec,todo
---

# 可选 prose lint adapter

## CLI 行为

- `storyspec style:lint --json` 现在输出 `adapters` 数组。
- 内置 style finding 增加 `source: "built-in"`。
- 若 `spec/style/adapters.json` 启用 `vale` 或 `textlint`，但 CLI 未配置外部 runner，会安全标记为 skipped，不影响内置 lint。

## 模板契约

- 不把 Vale 或 textlint 加入必装依赖。
- 应用层支持注入 adapter runner，便于后续真实接入外部工具并合并 finding。
- adapter finding 可用 `source` 标记来源；不会自动修改作者正文。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- 不新增外部工具配置模板，避免暗示用户已安装 Vale/textlint。

## 验证

- `openspec validate add-optional-prose-lint-adapters --strict --json --no-interactive`
- `npx vitest run tests/unit/manage-style.test.ts -t "prose lint adapter|prose lint adapters"`
