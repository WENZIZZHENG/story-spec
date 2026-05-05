## S. 共享契约

- [x] S.1 冻结权重优先级：项目级 `spec/reviewer-config.json` > active preset manifest > default。
- [x] S.2 冻结兼容性：未配置时 score 保持旧公式，输出只新增字段。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 project reviewer config 覆盖 preset/default。
  - May edit: `tests/unit/review-project.test.ts`
  - Must not edit: `src/application/review-project.ts`
  - Depends on: S.1
  - Validation: 先运行目标单测看到 reviewer 缺少 `weight` 或 score 未按权重变化。

- [x] P.2 用 TDD 覆盖 active preset `reviewerWeights` 生效，未配置 reviewer 回落 default。
  - May edit: `tests/unit/review-project.test.ts`
  - Must not edit: `src/application/review-project.ts`
  - Depends on: P.1
  - Validation: 先运行目标单测看到 preset 权重未被读取。

- [x] P.3 实现权重解析、score 加权和 JSON/text 输出字段。
  - May edit: `src/application/review-project.ts`
  - Must not edit: `src/domain/preset-manifest.ts`
  - Depends on: P.2
  - Validation: 目标单测通过。

- [x] P.4 同步 CLI smoke、changeset、生态路线和待办入口。
  - May edit: `tests/smoke/cli-commands.test.ts`, `changes/*.md`, `docs/tech/storyspec-ecosystem-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README 未涉及的未实现能力
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate apply-reviewer-weights --strict --json --no-interactive`。
- [x] V.2 运行 `npm run build`、`npx vitest run tests/unit/review-project.test.ts tests/unit/preset-manifest.test.ts`、相关 review smoke、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
