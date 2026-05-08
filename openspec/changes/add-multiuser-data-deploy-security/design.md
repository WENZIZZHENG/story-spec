## 设计

### 数据生命周期

新增 `src/server/projects/project-lifecycle.ts`，只做计划与审计：

- `createProjectSnapshotPlan(project)`：生成 snapshot id、projectId、dataRoot、建议路径和创建时间。
- `createProjectExportManifest(project)`：生成可导出的 StorySpec 文件范围和 manifest。
- `createProjectDeletionPlan(project, actorUserId)`：生成删除计划，标明需要二次确认、dataRoot 和审计字段。
- `recordProjectLifecycleAudit()`：把 snapshot/export/delete plan 记录为 audit event。

第一版不直接压缩、不写磁盘、不删除文件，避免误删用户项目。

### 部署配置

新增：

- `docker-compose.yml`：app、postgres、redis 三个服务，app 使用当前包构建产物约定。
- `.env.example`：server host/port、database url、redis url、data root、session secret。
- `docs/deploy/self-hosted.md`：说明当前是控制平面基础，真实 PostgreSQL/Redis driver/worker 仍在路线图内。

### 安全回归

新增 `tests/security/multiuser-security.test.ts`，复用现有内存 repository 验证：

- 未登录拒绝项目 API。
- 跨项目拒绝 job 查询/列表。
- 路径穿越拒绝。
- runtime output 必须 preview-only。

## 边界

- 生命周期服务不替代备份系统。
- 部署文档只描述当前可用 server 和 planned 依赖边界，不假装真实数据库 driver 已接入。
- 安全测试不替代渗透测试。
