---
change_type: minor
scope: cli,plugins,docs,tests,openspec,todo
---

# extension:add 扩展安装别名

## CLI 行为

- 新增 `storyspec extension:add <name>`，作为 `plugins:add <name>` 的语义化薄 alias。
- `extension:add --dry-run` 复用现有插件 install plan 和 dry-run renderer，输出写入路径、agent integration 影响、冲突和 manifest kind。
- `plugins:add --dry-run` 也会显示 `Manifest kind: <kind>`，方便区分 extension、preset、style-pack 等生态包类型。

## 模板契约

- 不修改 agent command 模板或用户项目模板。
- 不新增 extension registry 或远程 marketplace。
- 非 `extension` kind 的包第一版仍走同一安装计划，输出中明确实际 manifest kind。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- CLI help 现在包含 `extension:add [options] <name>`。

## 验证

- `openspec validate add-extension-add-alias --strict --json --no-interactive`
- `npm run build`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "renders help and info|previews plugin installation|previews extension installation|blocks plugin overwrite"`
- `node dist/cli.js --help`
- `node dist/cli.js extension:add --help`
- `npm run check:changes`
- `git diff --check`
