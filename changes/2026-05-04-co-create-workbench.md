---
change_type: minor
scope: cli,application,docs,tests
---

# 连续共创输入入口

## CLI 行为

- 新增 `storyspec co:create [story]`，可在一条命令里串联长文吸收、核心信息面板和可选 preview。
- 默认模式只预览，不写入澄清记录。
- 传 `--apply-confirmed` 后才写入识别为作者明确表达的字段。
- 支持 `--preview specify|plan|both` 生成写入前预览，正式文件仍需 `storyspec apply <preview-id> --yes` 才会覆盖。

## 模板契约

- 共创入口复用 `ingest`、`core` 和 `preview` 的确认门禁。
- 连续入口不会把候选项或未确认建议提升为正典。

## 生成产物

- 新增 co-create 工作台应用服务和 CLI 命令注册。
- README、帮助测试和路线图同步记录连续入口。

## 验证

- `npm test -- tests/unit/co-create-workbench.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/co-create-cli.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "renders help and info"`
