## Why

`docs:finish` 目前只能输出文档-only 收尾清单，文档维护任务仍需要人工串联 `git diff --check`、placeholder 扫描、Git 状态判断和本地 commit。活跃待办要求它补齐与 `task:finish --commit` 类似的安全提交闭环。

## What Changes

- `docs:finish` 新增 `--commit`，`--message <commit_message>` 作为 commit message。
- 默认 `docs:finish` 继续只做 preview，不写文件、不执行提交。
- 请求 `--commit` 后，命令执行文档收尾检查；placeholder 或 `git diff --check` 失败时阻断提交。
- Git 工作区存在非文档-only change 或 Git 不可用时跳过 commit，并在 JSON / 摘要中说明原因。

## Impact

影响 `docs:finish` 应用服务、CLI 选项、Git / 验证 runner 注入、单元测试、smoke 测试、changeset 和待办状态。该变更不主动 push，不自动提交代码变更或 unrelated change。

## Capabilities

- `cli-docs-finish`
