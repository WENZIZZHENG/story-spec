---
change_type: patch
scope: cli,presets,docs,tests,openspec,todo
---

# 生态包类型展示口径统一

## CLI 行为

- `storyspec plugins:add <name> --dry-run` 和 `storyspec extension:add <name> --dry-run` 现在显示 `包类型: <中文名> (<kind>)`。
- dry-run 的影响段落统一为“安装影响”，继续展示写入路径、agent integration 状态和冲突诊断。
- `storyspec preset:list` 和 `storyspec preset:doctor` 的文本输出明确把 genre preset 标为“类型包”，并显示 genre id。

## 模板契约

- 不修改插件、extension 或 preset manifest schema。
- 不改变 agent command 模板或生成规则。
- 文案只描述已实现入口，不引入 marketplace 或远程生态包发现服务。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- CLI help 命令列表不变。

## 验证

- `openspec validate align-ecosystem-kind-copy --strict --json --no-interactive`
- `npm run build`
- `npx vitest run tests/unit/manage-presets.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "previews plugin installation|previews extension installation|installs and validates a genre preset"`
