## 设计

本变更选择继续沿用项目级约定：`bun.lock` 是锁文件，贡献者命令仍以 `package.json` 的 npm scripts 为准。CI 的职责是用 Bun 按锁文件安装依赖，再运行现有 `npm run verify`，避免把依赖管理迁移和验证脚本迁移混成一个改动。

## 方案取舍

- 选择 Bun frozen install：与现有 `bun.lock` 和项目 AGENTS 约定一致。
- 暂不生成 `package-lock.json`：这会构成包管理器迁移，需要额外修改项目约定和审计策略。
- 保留 `actions/setup-node@v4`：`npm run verify`、Node 版本矩阵和项目运行时仍需要 Node 20/22 验证。
- 新增 `oven-sh/setup-bun@v2`：Bun 官方 CI 文档和 action README 均使用该 action 设置 Bun。

## 源文件边界

- 修改 `.github/workflows/ci.yml`：增加 setup-bun，安装步骤改为 `bun install --frozen-lockfile`。
- 修改 `docs/local-development.md`：环境和安装说明改为 Node.js + Bun + npm scripts。
- 新增 `tests/unit/ci-workflow.test.ts`：直接读取 workflow 文本，防止 CI 回退到无锁 npm install。
- 不修改 `package.json` scripts、`bun.lock`、业务源码或 `dist/**`。

## 验证

- 先写 CI workflow 测试，确认当前 workflow 因缺少 setup-bun / frozen install 失败。
- 修改 CI 与文档后运行目标单测。
- 运行 OpenSpec 严格校验、`npm run build`、`npm test`、`npm run check:changes`、`git diff --check`。
