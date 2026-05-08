## Why

`MU-01` 到 `MU-06` 已有多用户 server、项目隔离、job 控制面、审计和配额，但 job 仍只是元数据，App 也缺少项目/成员/job 列表与 readiness 视图。进入 `MU-07` 到 `MU-10` 时，需要先建立 runtime adapter、OpenHands 边界、App 回流 API 和故障定位字段。

## What Changes

- 新增 `AgentRuntimeAdapter` 接口和 `LocalStorySpecRunner`，可把 queued job 通过统一接口标记为 running/succeeded/failed。
- 新增 `OpenHandsRunner` PoC adapter，只验证命令构造、工作区边界和 preview-only 输出约束，不引入真实依赖。
- 扩展 server repository 接口，支持受保护项目列表、成员列表、job 列表 API。
- 新增 readiness endpoint 和 job trace 字段，错误响应可携带可选 trace。

## Non-goals

- 不接真实 BullMQ/Redis worker。
- 不安装或调用真实 OpenHands。
- 不做多人实时协作、共享链接或团队权限矩阵。
- 不把 runtime 输出直接写入正典、正文或 apply 结果。

## Impact

影响 `src/server/agent-runtime/*`、`src/server/http/*`、`src/server/projects/*`、`src/server/jobs/*`、`tests/unit/*multiuser*`、changeset 和多用户路线图。

## Capabilities

- `multiuser-runtime-app-observability`
