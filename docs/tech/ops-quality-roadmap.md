# 运维、安全与质量路线图

## 状态

Planned。本文承接完整 App 与多人平台的安全、部署、观测性、备份恢复、场景测试、维护性和依赖升级任务。它不单独定义产品能力，而是为 P1/P2 实现提供门禁。

## 覆盖功能缺口

- 安全和数据保护：登录策略、CSRF/CORS/cookie、rate limit、上传限制、敏感操作二次确认、audit log 保护、备份访问控制、管理员工具、secret 管理和安全回归。
- 生产部署和运维：部署拓扑、`.env`、health/ready、结构化日志、metrics、trace id、迁移回滚、升级说明、备份恢复、Docker image、Windows/Linux 差异和资源限制。
- 测试体系：API contract、真实数据库 integration、worker queue、权限矩阵、多用户并发、Playwright E2E、视觉回归、migration、备份恢复、安全回归、负载和浏览器兼容。
- 维护性和技术债：大文件拆分、命令产物分离、包管理器策略、依赖升级、事实边界检查和 OpenSpec 归档。

## P2-1 安全和数据保护

- 类型：安全、权限、数据保护
- 背景/问题：完整多人 App 会处理作者私有故事、团队协作、agent job 和导入资料；基础 session/project guard 不足以覆盖浏览器端和生产部署风险。
- 已有基础：session/project guard、路径解析防护、audit/quota foundation、少量 security tests、自托管说明。
- 缺口：缺登录策略、CSRF、CORS、session cookie、same-site、secure cookie、rate limit、文件上传限制、敏感操作二次确认、audit log 保护、备份访问控制、密钥管理、删除流程、管理员工具和安全回归测试。
- 建议方案：按风险分成认证/浏览器安全、上传/导入安全、敏感操作门禁、管理员工具、安全回归五个 OpenSpec 或阶段。
- 涉及文件/模块：`src/server/auth/*`、`src/server/http/*`、`src/server/audit/*`、`src/server/projects/*`、tests/security、`docs/deploy/self-hosted.md`。
- 验收标准：所有高风险 API 有权限检查和审计；跨租户访问失败；删除和 apply 都有二次确认或等价门禁；越权、路径逃逸、重复提交、过期 token、跨项目 job 查询进入安全回归。
- 不做/边界：不为了方便协作降低作者控制权和数据隔离。

## P2-2 生产级可观测性、备份和数据生命周期

- 类型：部署、运维、数据安全
- 背景/问题：自托管多人平台必须知道服务是否健康、任务为什么失败、项目如何备份、删除如何二次确认和恢复。
- 已有基础：health/ready、audit、project snapshot/export/delete plan、自托管说明。
- 缺口：缺结构化日志、metrics/tracing、备份/恢复演练、保留策略、导出包校验和删除执行器。
- 建议方案：把 observability 和 lifecycle 拆成两个 OpenSpec：先日志/metrics/ready，再备份/恢复/删除执行。
- 涉及文件/模块：`src/server/http/*`、`src/server/projects/project-lifecycle.ts`、`src/server/audit/*`、`docs/deploy/self-hosted.md`。
- 验收标准：ready 能暴露数据库/队列状态；job 和请求有 trace id；项目导出可校验；删除必须二次确认并写 audit。
- 参考项目/资料：当前 `add-multiuser-data-deploy-security`。
- 不做/边界：不承诺企业级 HA。

## P2-3 场景化测试体系

- 类型：测试、质量门禁
- 背景/问题：当前 unit/smoke 覆盖较好，但多人平台不能只看 coverage；权限、API contract、数据库、worker、E2E、视觉和安全场景需要成为实现门禁。
- 已有基础：unit tests、smoke tests、`tests/security`、coverage 门槛、command manifest。
- 缺口：缺 API contract tests、真实数据库 integration tests、worker queue tests、权限矩阵测试、多用户并发测试、Playwright E2E、前端视觉回归、migration tests、备份恢复测试、安全回归、负载测试和浏览器兼容测试。
- 建议方案：每个多人平台 OpenSpec 必须声明匹配风险的验证组合；优先补 API contract、权限矩阵、数据库 integration 和 worker lifecycle。
- 涉及文件/模块：`tests/unit`、`tests/smoke`、`tests/security`、未来 `tests/contract`、`tests/e2e`、CI。
- 验收标准：每个多人平台 OpenSpec 至少选择 unit / integration / e2e / security / contract 中匹配风险的一组验证；关键用户路径不以 coverage 数字替代。
- 不做/边界：不追求无意义覆盖率数字；优先保护作者控制权、数据隔离和正典写入边界。

## P2-4 大文件拆分与测试盲区收口

- 类型：维护性、测试
- 背景/问题：`local-app-html.ts`、`local-app-server.ts`、`workbench.command.ts`、`plugins/manager.ts` 文件偏大；后续多人 App 开发会放大理解和冲突成本。
- 已有基础：unit/smoke 覆盖整体较好；coverage 已暴露 plugin manager、interactive utils、部分 run/review/style 分支盲区。
- 缺口：缺少按模块拆分计划和覆盖率分阶段目标。
- 建议方案：
  1. 将本机 App HTML 拆为 render section / static assets / API client string。
  2. 将 App server routes 拆为项目、故事 intake、大纲任务、章节、review/resume。
  3. 将 Workbench CLI 按命令族拆分。
  4. 为 plugin manager 的 source 解析、hook 错误、force 覆盖和版本范围补测试。
- 涉及文件/模块：`src/app-server/local-app-html.ts`、`src/app-server/local-app-server.ts`、`src/cli/commands/workbench.command.ts`、`src/plugins/manager.ts`、`src/utils/interactive.ts`、tests。
- 验收标准：单文件职责变清；现有 smoke 不退化；plugin manager statements 明显提升；拆分不改变 CLI 输出。
- 参考项目/资料：当前 coverage 报告、`docs/tech/architecture.md` 模块边界。
- 不做/边界：不做无关重构；不把本机 App 一次性迁到完整前端框架。

## P2-5 依赖升级和兼容矩阵

- 类型：依赖维护、兼容性
- 背景/问题：`npm outdated` 显示 Commander typings、Vitest coverage、glob、inquirer、ora、TypeScript 等存在 major 或 minor 更新；直接升级可能影响 CLI 行为、测试和 ESM。
- 已有基础：Node 20/22 CI、unit/smoke、command manifest。
- 缺口：缺少“先小后大”的依赖升级路线和回滚策略。
- 建议方案：先升级 patch/minor，再单独评估 major；每次升级必须跑 build、unit、smoke、manifest 和 Windows/Ubuntu CI。
- 涉及文件/模块：`package.json`、锁文件、CI、CLI command tests。
- 验收标准：依赖升级 PR 有分组、风险说明和验证命令；Node 20/22 均通过；CLI help 和 JSON 输出无非预期变化。
- 参考项目/资料：各依赖 release notes，进入实现前联网核验。
- 不做/边界：不把依赖升级和功能开发混在一个 change。
