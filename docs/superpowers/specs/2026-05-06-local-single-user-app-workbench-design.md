# 本机 Web 工作台设计

## 状态

已确认设计。本文记录 `add-local-single-user-app-workbench` 的第一版产品和技术设计，用作后续 OpenSpec change 与实施计划输入；不表示功能已实现。

## 目标

StorySpec 第一版 App 采用“本机 Web 工作台”路线：作者运行 `storyspec app`，浏览器打开本机地址，选择或创建一个本地 StorySpec 项目，然后在可视化工作台里继续创作。

本阶段重点是降低 CLI 使用门槛，不做云端账号、多用户项目隔离、团队协作、计费、公开社区或实时编辑。

## 已确认决策

- App 类型：本机 Web 工作台。
- 项目入口：启动后选择一个 StorySpec 项目根目录，并记住最近打开的项目。
- 创建项目：App 内支持创建新项目，复用现有 `src/application/init-project.ts`。
- 默认 agent：`codex`。
- 核心约束：保留 CLI；所有高影响 AI 输出仍必须走 preview / confirm / apply。
- 视觉方向：纸面档案 + 本机写作控制台。它应像作者的创作室和控制台，不像营销页，也不做通用 SaaS 模板。

## 技术栈

- 前端：`Vite + React + TypeScript`。
- UI：`Tailwind CSS + shadcn/ui`，必要时补充少量项目级 design tokens。
- 路由：`React Router`。
- 本地服务：`Fastify`。
- 存储：继续读写本地 StorySpec 项目文件，不引入数据库。
- 启动命令：新增 `storyspec app`，默认绑定 `127.0.0.1`。

选择 `Vite + Fastify` 是因为第一版运行在本机，由 CLI 启动、读写本地项目目录并随 npm 包分发。`Next.js` 更适合后续云端多人版，不作为本机版第一选择。

## 参考和借鉴

- Vite 官方文档：借鉴轻量前端开发服务器和生产构建方式。落地为 `apps/web` 或等价目录的 React/Vite 前端包。
- Fastify 官方文档：借鉴本地 API 服务、插件化和 TypeScript 友好边界。落地为 `src/app-server` 或等价目录。
- shadcn/ui：借鉴可组合组件、无重运行时组件库和 Tailwind 设计方式。落地时只引入需要的组件。
- Plot Bunni：借鉴小说项目列表、作品工作台、章节/场景组织和写作工具的信息架构；不照搬 IndexedDB 存储，StorySpec 仍以本地项目文件为事实源。
- Novel / Tiptap：后续若做富文本章节编辑器再参考；第一版先使用 Markdown/textarea 或轻量编辑器，避免提前扩大范围。

## 页面结构

第一版至少包含四个页面或视图：

1. 项目选择页
   - 显示最近打开项目。
   - 支持打开已有 StorySpec 项目根目录。
   - 支持创建新项目。
   - 校验 `.specify/config.json` 是否存在。

2. 创建项目页或弹层
   - 基础字段：项目名称、保存位置、写作方法。
   - 高级选项：agent、是否初始化 Git、是否启用专家模式、插件。
   - 默认 agent 为 `codex`。
   - 调用 `initProject()`，创建完成后写入最近项目并进入工作台。

3. 故事工作台
   - 展示项目状态、当前故事、成熟阶段、核心缺口、下一步建议。
   - 复用 `getProjectStatus()` 和现有 application/domain 层能力。
   - 入口模块包含输入、核心、大纲、任务、章节。

4. 预览与确认队列
   - 展示待确认 preview、来源、影响范围和写入目标。
   - 用户确认后才调用 apply。
   - 明确区分候选、已确认、已写入。

## 第一版导航

- 项目：最近项目、打开目录、创建项目、项目状态。
- 输入：一句灵感、长文资料、表格资料、随便聊聊。
- 核心：人物、世界观、主题、承诺、缺口和待确认决策。
- 大纲：当前正式大纲、候选大纲、比较、提升为正式计划。
- 任务：任务板、下一步、阻塞项、上下文包。
- 章节：章节草稿入口、章节状态、写后自检入口。第一版不必实现完整富文本编辑器。

实现优先级：

1. 项目、输入、核心。
2. 大纲、任务。
3. 章节。

## 数据流

```text
浏览器 UI
  -> 本地 Fastify API
  -> application service adapter
  -> 现有 src/application / src/domain
  -> 本地 StorySpec 项目文件
```

前端不直接拼 CLI 命令，也不直接读写任意文件。所有写入必须通过本地 API 和 application 层 adapter。

## 本机安全边界

- 服务默认只监听 `127.0.0.1`。
- 启动时生成本机 session token，前端 API 请求必须携带 token。
- API 只能访问用户已选择或已创建的项目根目录。
- 打开项目时必须校验 StorySpec 项目结构。
- 最近项目记录放在用户配置目录，不写入仓库。
- 路径处理必须做 `path.resolve` 与 allowlist 校验，避免通过相对路径越界读取。

## 错误和空状态

- 没有最近项目：显示打开已有项目和创建新项目两个主要动作。
- 目录不是 StorySpec 项目：提示缺少 `.specify/config.json`，可选择返回或在该目录创建项目。
- 项目创建失败：显示失败原因，不留下半确认状态。
- Git 不可用：工作台仍可使用，只在状态区提示。
- preview/apply 失败：保留预览记录，显示错误和可重试动作。

## 测试策略

- 单元测试：项目目录校验、最近项目记录、API adapter、preview/apply 门禁。
- 集成测试：创建项目后能读取状态；打开已有项目后能进入工作台。
- 安全测试：未选择目录不能读取；跨目录 path traversal 被拒绝；缺 token 的请求失败。
- UI 测试：项目选择、创建项目、工作台首屏、预览确认队列。

## 后续 OpenSpec 拆分

建议先新建 OpenSpec change `add-local-single-user-app-workbench`，覆盖：

- `storyspec app` 命令。
- 本地服务生命周期。
- 项目选择和创建。
- 工作台首屏和状态 API。
- 本机安全边界。

大纲候选、任务板、章节编辑器可作为后续 change 或同一 change 的后续阶段，避免第一版过大。

## 不做范围

- 不做账号系统。
- 不做云端数据库。
- 不做多人项目隔离。
- 不做实时协作。
- 不做公开分享或作品广场。
- 不做计费和用量套餐。
- 不默认引入富文本编辑器。
