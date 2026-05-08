## S. 共享契约

- [x] S.1 冻结范围：只交付多用户控制平面与 runtime 基线，不写具体认证、数据库、队列或 UI 代码。
- [x] S.2 冻结本机边界：`storyspec app` 继续作为本机单人工作台，不被改造成多用户生产服务。
- [x] S.3 冻结安全原则：多用户 API 的所有读写都必须经过 `userId + projectId` 授权和路径规范化。

## P. 实现任务

- [x] P.1 用 OpenSpec 文本冻结多用户控制平面最小模型。
  - May edit: `openspec/changes/design-multiuser-control-plane-and-agent-runtime/proposal.md`, `openspec/changes/design-multiuser-control-plane-and-agent-runtime/specs/multiuser-control-plane-and-agent-runtime/spec.md`
  - Must not edit: `src/**`, `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx openspec validate design-multiuser-control-plane-and-agent-runtime --strict --json --no-interactive`

- [x] P.2 冻结执行层抽象与 job 边界。
  - May edit: `openspec/changes/design-multiuser-control-plane-and-agent-runtime/design.md`, `openspec/changes/design-multiuser-control-plane-and-agent-runtime/specs/multiuser-control-plane-and-agent-runtime/spec.md`
  - Must not edit: `src/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx openspec validate design-multiuser-control-plane-and-agent-runtime --strict --json --no-interactive`

- [x] P.3 对齐多用户路线图和任务拆分的 change id。
  - May edit: `docs/tech/app-multiuser-roadmap.md`, `docs/tech/app-multiuser-development-tasks.md`, `docs/tech/todo-index.md`
  - Must not edit: `src/**`, `dist/**`
  - Depends on: P.1-P.2
  - Validation: `git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate design-multiuser-control-plane-and-agent-runtime --strict --json --no-interactive`。
- [x] V.2 运行 `git diff --check`。
- [x] V.3 在后续实现批次开始前，确认本 change 是唯一的多用户架构 baseline。
