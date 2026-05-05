## Why

StorySpec 已有 `check:changes`、`check:command-manifest`、agent acceptance、validate 等质量检查，但这些检查分散在 npm scripts、文档和单测中。后续接入 CI 时缺少统一的机器可读清单，agent 也很难知道“该跑哪些检查、失败时该看哪些文件”。

## What Changes

- 新增只读 `storyspec ci:check` 命令，输出本地 CI 质量检查清单。
- `--json` 输出稳定字段：`checkId`、`status`、`command`、`files`、`message`、`suggestedAction`。
- 第一版检查清单覆盖 changeset、command manifest、agent acceptance 和待办边界文档。
- 检查命令不运行 LLM、不联网、不修改文件；第一版只根据本地文件存在性和基础边界输出 pass/fail。
- 同步文档、changeset 和路线状态。

## Impact

影响 CLI 注册、CI 质量检查应用服务、smoke/unit 测试、命令文档、changeset 和路线状态。不新增 GitHub Actions workflow，不强制外部依赖。

## Capabilities

- `ci-quality-checks-manifest`
