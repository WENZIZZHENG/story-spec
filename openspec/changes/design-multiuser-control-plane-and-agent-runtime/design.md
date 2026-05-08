## 设计

本 change 只冻结多用户 App 的控制平面边界和执行抽象，不写具体 server 代码。整体分成三层：本机 `storyspec app` 继续作为单人本地工作台；新的多用户 server 承担认证、项目隔离、作业、审计和配额；`AgentRuntimeAdapter` 将业务语义和执行引擎隔离开，先 `LocalStorySpecRunner`，再 `OpenHandsRunner`。

## 控制平面模型

- `User`：账号主体。
- `Session`：登录态与失效控制。
- `Project`：故事项目元数据。
- `Membership`：用户与项目的归属关系，第一版先支持 owner/member 的最小角色模型。
- `AgentJob`：长任务状态机，状态包括 `queued`、`running`、`succeeded`、`failed`、`canceled`、`timeout`。
- `AuditLog`：记录 actor、project、source、diff summary、timestamp 和 job 关联。
- `QuotaBucket`：用户/项目级配额与限流边界。

## 存储与授权

- 所有项目读写都必须通过 `userId + projectId` 授权检查。
- 项目路径只能通过 `ProjectStorage` 规范化，必须拒绝 `..`、符号链接越界和客户端直传路径。
- StorySpec 文件内容继续保留文件形态，项目元数据、成员、作业、审计和配额走服务端控制平面。

## 执行层

- `AgentRuntimeAdapter` 统一定义 `validate`、`start`、`cancel`、`stream/logs` 和 `result`。
- `LocalStorySpecRunner` 先包裹现有本地能力，作为第一版 runtime。
- `OpenHandsRunner` 作为后续外部执行引擎接入点，优先用于异步长任务。
- `Cline` / `Aider` 只作为客户端入口或 handoff 目标，不作为多租户后端控制平面。
- 所有运行结果仍必须保留 candidate / preview / confirm / apply 门禁，不允许自动写正典。

## 验证边界

- OpenSpec change 只冻结架构和边界，不承诺具体实现。
- 后续 `MU-01` 到 `MU-14` 才会把该基线拆成 server、schema、auth、jobs、runtime、UI 和部署实现。
- 现有本机单人工作台继续保持独立，不被本 change 改造成多用户入口。
