## Why

多用户控制平面已经具备身份、项目隔离、job、审计、配额、runtime 和基础 App API。上线前仍缺数据生命周期、最小自托管配置和安全回归清单，否则用户无法可靠导出/删除项目，也无法在新机器上按一致配置启动。

## What Changes

- 新增项目生命周期服务：创建快照计划、导出清单、删除计划，并写入审计事件。
- 新增最小自托管配置：`docker-compose.yml`、`.env.example` 和部署说明。
- 新增安全回归测试，覆盖未登录、跨项目、路径穿越、job project mismatch 和 runtime preview-only。

## Non-goals

- 不实现跨区域灾备、增量备份或云对象存储。
- 不实际删除用户机器上的 StorySpec 项目文件；第一版输出可审计删除计划。
- 不承诺 Kubernetes、企业高可用或第三方安全审计。
- 不上线商业计费系统。

## Impact

影响 `src/server/projects/*`、`tests/security/*`、`docs/deploy/*`、`docker-compose.yml`、`.env.example`、changeset 和多用户路线图。

## Capabilities

- `multiuser-data-deploy-security`
