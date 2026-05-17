# add-collaboration-canon-review-read-api

## 背景

协作正典已经具备 proposal、review decision、canon patch 和 apply request 的 mutation 控制面与 PostgreSQL repository，但完整 App 的“候选与正典”页面仍缺少稳定读 API。前端如果只能创建数据、不能一次性读取审阅面板，就无法实现评论审批 UI、状态语言和作者确认流程。

## 目标

- 增加项目级协作正典审阅读模型，聚合 proposal、review decisions、patches 和 apply requests。
- 提供 GET API，让现有 collaboration 路径和前端契约中的 canon-review 页面都能读取同一数据。
- 保持 preview / confirm / apply 边界：读 API 只展示状态和下一步，不执行写入。

## 非目标

- 不实现真实 apply executor。
- 不实现评论线程 UI、通知或实时 presence。
- 不新增账号、邀请或完整独立前端项目。

## 影响范围

- `src/server/collaboration/canon-merge.ts`
- `src/server/db/repositories.ts`
- `src/server/http/multiuser-server.ts`
- `src/server/http/api-contract.ts`
- `tests/unit/*`
- `docs/tech/*`
