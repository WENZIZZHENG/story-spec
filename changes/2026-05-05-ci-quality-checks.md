---
change_type: minor
scope: cli,ci,docs,tests,openspec,todo
---

# CI 质量检查清单

## CLI 行为

- 新增 `storyspec ci:check`，输出本地 CI 质量检查清单。
- `storyspec ci:check --json` 输出 `projectRoot`、`valid` 和 `checks[]`。
- 每个 check 包含 `checkId`、`status`、`command`、`files`、`message`、`suggestedAction`。
- 第一版只读，不运行外部命令、不联网、不修改文件。

## 模板契约

- 不修改 agent command 模板或生成规则。
- 检查清单覆盖 changeset、command manifest、agent acceptance 和 todo 边界。
- JSON 契约用于后续 CI workflow 或 agent 自动化读取。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- 不新增 GitHub Actions workflow。

## 验证

- `openspec validate add-ci-quality-checks-manifest --strict --json --no-interactive`
- `npm run build`
- `npx vitest run tests/unit/ci-quality-checks.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "reports local CI quality checks|renders help and info"`
