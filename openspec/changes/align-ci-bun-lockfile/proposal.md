## Why

StorySpec 仓库当前以 `bun.lock` 作为锁文件，但 CI 使用 `npm install --package-lock=false --ignore-scripts`。这会绕过锁文件，导致全新 checkout、CI runner 和本地开发可能安装出不同依赖树；同时无 `package-lock.json` 时也无法把 `npm audit` 当作默认安全检查入口。

## What Changes

- 明确当前阶段继续使用 `bun.lock` 作为依赖锁定事实源。
- CI 安装 Bun，并使用 `bun install --frozen-lockfile` 安装依赖。
- 保留现有 `npm run verify` 作为验证命令入口，避免一次性迁移所有 npm scripts。
- 更新本地开发文档，说明需要 Bun 与 frozen lockfile 安装方式。
- 新增 CI workflow 单测，锁定 CI 不再回退到无锁 npm install。

## Non-goals

- 不升级依赖版本。
- 不迁移到 `package-lock.json`。
- 不改变 CLI 行为、命令产物或业务代码。
- 不在本任务引入新的安全扫描服务；只记录后续安全扫描入口的约束。

## Impact

影响 `.github/workflows/ci.yml`、`docs/local-development.md`、CI workflow 测试和平台地基路线图。实现不修改 `dist/**`，不新增产品能力。

## Capabilities

- `platform-foundation`
