---
change_type: patch
scope: ci,docs
---

# CI 依赖安装改为 Bun frozen lockfile

## CLI 行为

- 无用户可见 CLI 行为变化；构建、测试和 CLI 开发入口仍使用 `package.json` 中的 npm scripts。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- CI 现在通过 `oven-sh/setup-bun@v2` 使用 `.bun-version` 固定 Bun 版本，并通过 `bun install --frozen-lockfile` 按 `bun.lock` 安装依赖。
- 本地开发文档同步说明：`bun.lock` 是依赖锁文件，依赖安装使用 Bun。
- 新增 CI workflow 单测，防止未来回退到 `npm install --package-lock=false` 这种无锁安装方式。

## 验证

- `npx openspec validate align-ci-bun-lockfile --strict --json --no-interactive`
- `npx vitest run tests/unit/ci-workflow.test.ts`
