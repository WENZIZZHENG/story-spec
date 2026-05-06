## 设计

第一版实现“本机工作台地基”，先让 `storyspec app` 能可靠启动并管理一个本地 StorySpec 项目。完整 Web UI 分阶段建设；本 change 不把云端 SaaS 架构提前引入仓库。

## 源文件边界

- 新增或修改 `src/application/*`：项目根目录校验、最近项目记录、App 创建项目输入适配。
- 新增或修改 `src/app-server/*`：本地 server 和 API 边界。后续前端静态资源也由这里托管。
- 新增 `src/cli/commands/app.command.ts` 并在 `src/cli/program.ts` 注册。
- 未来前端源文件放在 `apps/web/` 或等价目录；构建产物不得手工编辑。
- 不手工编辑 `dist/**`。

## 本地项目模型

第一阶段没有数据库和账号。App 只管理用户明确选择或创建的 StorySpec 项目根目录。

项目根目录判定：

- 必须存在 `.specify/config.json`。
- `config.json` 必须是可读 JSON。
- 项目名优先取 `config.name`，否则取目录名。

最近项目记录：

- 存在用户配置目录下，不写入项目仓库。
- 记录绝对路径、项目名和最近打开时间。
- 记录前重新校验项目根目录。
- 列表按最近打开时间倒序。

创建项目：

- App 表单传入项目名称、保存位置、写作方法和高级选项。
- 默认 agent 为 `codex`。
- 调用 `initProject()`，不复制一套初始化逻辑。
- 创建成功后立即加入最近项目。

## 本地服务边界

- 默认监听 `127.0.0.1`。
- 启动时生成 session token。
- API 请求必须携带 token。
- API 只能访问 allowlist 中的项目根目录；allowlist 来自本次启动期间用户选择或创建的项目。
- 路径进入 allowlist 前必须 `path.resolve`，避免相对路径越界。

第一批 API：

- `GET /api/app/health`：返回服务状态和是否需要 token。
- `GET /api/projects/recent`：返回最近项目列表。
- `POST /api/projects/open`：校验并打开已有项目，加入 allowlist 和最近项目。
- `POST /api/projects/create`：创建新项目，加入 allowlist 和最近项目。
- `GET /api/projects/current/status`：返回当前项目的 `getProjectStatus()`。

第一批 HTTP 实现先使用 Node 内置 `http`，避免在工作台前端未落地前引入额外运行时依赖；后续接入完整 Web UI 时可按需要迁移到 Fastify。

## UI 方向

视觉方向采用“纸面档案 + 本机写作控制台”。工作台应提供密集但清晰的信息结构，而不是营销页：

- 左侧：当前项目、项目切换、功能导航。
- 中间：项目状态、输入入口、故事骨架。
- 右侧：下一步建议、确认门禁和待确认项。

第一版 UI 可先接入项目选择页和工作台首屏；大纲、任务、章节视图可后续 change 实现。

## 创作控制权

本 change 不新增绕过确认的写入能力。App 中所有涉及正典、计划、任务或正文的高影响写入，后续都必须复用 preview / confirm / apply。第一批状态 API 只能展示状态和下一步建议，不直接写入正典。

## 参考项目/资料

- Vite 官方文档：前端开发和静态构建参考。
- Fastify 官方文档：本地 API 服务和 TypeScript 插件边界参考。
- shadcn/ui：组件组合和 Tailwind 风格参考。
- Plot Bunni：小说工作台信息架构参考；不照搬存储。
- Novel / Tiptap：后续章节编辑器参考；本 change 不默认引入。
