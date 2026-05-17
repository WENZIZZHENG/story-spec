## Why

Runtime output 已有 record、PostgreSQL repository 和项目级只读 API，但完整 App shell 还没有把 job output artifacts/logs 纳入任务中心 UI 契约。作者和 reviewer 需要能从任务中心理解 agent 输出仍是 preview-only，后续独立前端也需要稳定 endpoint 和状态语言。

## What Changes

- 扩展完整 App 前端架构契约，为任务中心加入 runtime output 只读 endpoint。
- 新增任务中心 runtime output UI contract，描述 artifacts/logs 视图、空状态、错误状态和 preview-only 边界。
- 在本机 shell 渲染 runtime output 只读面板和 endpoint 地图，不连接真实多人 server。

## Non-goals

- 不实现独立 React/Vite/Next 前端项目。
- 不新增 server mutation API。
- 不自动 apply runtime output，不创建 proposal，不重试或取消 job。
- 不修改 worker 执行路径。

## SDD 分级

standard。该切片新增用户可见 UI 契约和本机 shell 展示，但不改变 server 写入行为、worker 调度或数据库 schema。

## Impact

影响 `src/app-server/*`、frontend architecture/local shell tests、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `runtime-output-ui-slice`
