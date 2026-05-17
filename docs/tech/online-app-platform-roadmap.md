# 完整 App 与多人在线写作平台路线图

## 状态

Planned。本文是“完整 App 与多人在线写作平台”的轻量总览入口；具体任务已经拆到子路线，避免后续开发每次读取一整篇大文档。本文不表示多人协作、完整 App、真实 worker、云端 SaaS 或富文本能力已经实现。

## 当前主线

先把构建、依赖、命令产物和文档事实边界收稳，再完成完整 App 产品体验设计，随后按角色模型、API contract、真实数据库、真实 worker、完整前端、协作正典协议的顺序推进。任何多人协作、富文本、实时编辑、agent 自动执行或正典合并能力，都必须继续保留作者确认、preview / confirm / apply、来源追踪和可回滚边界。

## 共通边界

- 不把路线图内容写成 README 的已实现能力。
- 不在一个 OpenSpec 里一次性实现完整 SaaS。
- 不绕过 StorySpec 的作者确认、候选与正典边界。
- 不默认引入大型前端框架、CRDT、数据库 driver 或队列依赖；具体依赖必须在对应 OpenSpec 中单独论证。
- 不承诺商业计费、企业高可用、Kubernetes 或公开社区能力。

## 子路线索引

| 优先级 | 子路线 | 状态 | 覆盖范围 | 下一步 |
| --- | --- | --- | --- | --- |
| P0 | [平台地基与发布边界路线图](platform-foundation-roadmap.md) | Completed | 依赖/CI 可复现性、命令产物/runtime 清理边界和 README 事实边界已完成 | 下一步转入 P1-0 完整 App 产品体验设计 |
| P1 | [完整 App 产品体验路线图](app-ux-roadmap.md) | Planned | 产品体验设计、信息架构、首批页面、状态语言、编辑器与工作台体验 | 先产出 P1-0 产品体验设计规格 |
| P1 | [多人平台与 API 契约路线图](multiuser-platform-roadmap.md) | Active | 角色模型、API contract、真实 PostgreSQL、真实 worker、完整前端架构 | 角色模型、API contract、PostgreSQL driver、worker 队列、显式 OpenHands headless executor、worker lease/heartbeat、stale worker recovery plan、stale job timeout recovery executor、worker job lock、preview runtime output record、runtime output PostgreSQL repository、runtime output 只读 API、runtime output 本机 UI contract、`apps/web/` 独立 shell、登录/权限只读 UI contract、静态构建链、本地预览服务和前端架构契约底座已完成；下一步进入错误边界、E2E 和生产可靠性 |
| P1/P2 | [协作写作与正典合并路线图](collaboration-canon-roadmap.md) | Active | 候选、评论、审批、正典 patch、导入导出、插件/团队模板 | 协作正典协议底座、HTTP 控制面和 PostgreSQL repository 已完成；后续补评论审批 UI 和真实 apply executor |
| P2/P3 | [运维、安全与质量路线图](ops-quality-roadmap.md) | Planned | 安全、部署、观测性、备份恢复、场景测试、大文件拆分、依赖升级 | 随 P1 实现分批补门禁 |

## 背景和体检证据

- 2026-05-11 体检通过：`npm run build`、`npm test`、`npm run test:smoke`、`npm run test:coverage`、`npm run check:changes`、`npm run check:command-manifest`。
- 覆盖率基线：overall statements 85.93%，branches 78.91%，functions 92.33%，lines 85.93%；但 `src/plugins/manager.ts`、`src/utils/interactive.ts`、多用户真实 driver / worker 边界和部分命令外壳仍是测试盲区。
- 当前 `storyspec app` 已覆盖本机服务地基、零依赖工作台 shell、首批前端 route/API/status contract、项目抽屉、最近项目、创作入口、核心缺口、多大纲候选、只读任务板、章节写作通道、章节草稿入口、写后自检和继续创作回流。
- 当前 `storyspec server` 已有多用户控制平面基础、session/project guard、项目/成员/job 列表、job 控制、审计/配额守卫、runtime adapter foundation、数据库 schema/migration plan 和最小自托管说明。
- 仍未完成：账号/团队完整产品流、错误边界、E2E、实时协同编辑、评论/审批 UI、通知、worker 持久化锁接入和部署运维。

## 参考资料校准

- Yjs 官方文档：借鉴 shared types、awareness、离线与实时协同模型；不把正式正典文件直接变成 CRDT 文档。
- Tiptap / Hocuspocus 官方文档：借鉴富文本编辑器、WebSocket 协作服务和 presence；不把 Tiptap 作为默认结论。
- ProseMirror 官方文档：借鉴 schema、transaction、插件化编辑器模型；不把编辑器 schema 等同于 StorySpec 故事 schema。
- Liveblocks 官方文档：借鉴 presence、comments、notifications 的产品能力边界；默认不引入托管协作服务，自托管优先。

## 拆分映射

- 原 P0 地基任务迁入 [platform-foundation-roadmap.md](platform-foundation-roadmap.md)。
- 原 P1-0 和前端/编辑器/工作台/离线体验缺口迁入 [app-ux-roadmap.md](app-ux-roadmap.md)。
- 原账号权限、真实持久化、worker、完整前端架构任务迁入 [multiuser-platform-roadmap.md](multiuser-platform-roadmap.md)，并新增 API contract 前置设计。
- 原协作、评论审批、正典合并、导入导出、插件/团队模板和长期商业能力迁入 [collaboration-canon-roadmap.md](collaboration-canon-roadmap.md)。
- 原安全、部署、测试、维护性、依赖升级和观测性任务迁入 [ops-quality-roadmap.md](ops-quality-roadmap.md)。

## 推荐推进顺序

1. [app-ux-roadmap.md](app-ux-roadmap.md) 的 P1-0 完整 App 产品体验与界面重设计。
2. [multiuser-platform-roadmap.md](multiuser-platform-roadmap.md) 的 API contract 前置设计。
3. 协作正典 UI、错误边界和 E2E。
4. 协作写作、正典合并、评论审批、导入导出和编辑器能力。
5. 运维、安全、测试、依赖升级和长期研究按真实风险分批推进。

## 完成同步

- 每个 P0/P1 任务进入实现前必须新建或关联 OpenSpec change。
- 涉及 CLI、公共 API、模板契约、生成产物或用户文档时，新增 `changes/*.md`。
- 完成子路线任务后更新对应子路线状态，并在 `todo-archive.md` 增加归档证据。
- `todo-index.md` 只保留仍未完成的 Planned / Active 入口。
