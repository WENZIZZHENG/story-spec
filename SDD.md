# StorySpec 项目 SDD

## 状态

Stable Maintenance。本文档是 StorySpec 仓库的项目级维护契约，优先级高于全局 SDD 中与本项目冲突的规则。项目主体重构已经完成，后续默认以稳定、清晰、可验证和保护作者创作控制权为中心。

## 1. 适用范围

- 适用于本仓库的代码、CLI、模板、脚本源、生成产物、测试、技术文档和项目结构维护。
- `novel-sdd.md` 是产品方法论与创作理念文档，不是开发规范，不参与本仓库开发流程约束。
- `docs/tech/todo-index.md` 是长期活跃待办入口；`docs/tech/todo-governance.md` 定义待办、路线图和归档规则。
- `docs/tech/todo-archive.md` 与 `changes/*.md` 记录已完成路线和已发生变化，不作为活跃开发入口。

## 2. 优先级

遇到冲突时按以下顺序执行：

1. 用户最新明确指令。
2. 本文件 `SDD.md`。
3. 仓库 `AGENTS.md`。
4. `docs/tech/todo-index.md` 与当前活跃路线文件。
5. 全局 SDD。

全局 SDD 只作为兜底流程参考；凡是本文件已经规定的事项，以本文件为准。

## 3. 维护原则

- 默认小步、兼容、可回滚；不再默认采用破坏性重构策略。
- 破坏性变更必须有明确理由，并同步 CLI 提示、文档、测试和 changeset。
- 优先保持用户项目可升级、可理解、可继续写作。
- 不为历史包袱无限兼容；确需删除旧行为时，给出真实迁移路径或明确不兼容原因。
- 不把生成目录当源目录维护；修改源文件后通过构建或测试验证生成链路。
- 不把尚未实现的目标写成已完成能力。

## 4. 创作控制权原则

StorySpec 的核心是帮助作者保留创作空间，而不是替作者过早决定故事。

- 初始化、澄清、规格、计划和写作命令应优先提出需要澄清的问题，而不是直接扩写大量设定。
- 示例应作为可复制分叉和启发，不应伪装成唯一答案。
- 高影响写入应保留 preview / confirm / apply 或等价确认机制。
- 世界观、角色关系、主题、正典事实和感情推进等关键决策，应能追溯来源，区分作者确认与 AI 建议。

## 5. 事实源目录

- `src/`：CLI、应用服务、领域模型、校验和 agent 集成源代码。
- `templates/`：用户项目模板源，包括命令、知识库、追踪文件、世界观、风格、研究和反馈模板。
- `scripts/`：用户项目 `.specify/scripts/` 的脚本源。
- `memory/`：初始化用户项目 `.specify/memory/` 的创作原则与声音模板。
- `spec/presets/`：内置写作方法预设，会进入生成产物和用户项目。
- `plugins/`：可选插件、扩展命令和知识包。
- `dist/`：构建产物，不手工维护。
- 根目录 `.specify/`、`stories/`、`spec/tracking/`、`.claude/`、`.codex/` 是本地生成物或用户项目数据，不作为仓库源目录。

## 6. 开发流程

1. 定位：先读相关源文件、测试和当前文档；只有长期路线才读取并更新 `docs/tech/todo-index.md`。
2. 定界：明确本次目标、非目标、兼容影响和验证方式。
3. 实施：按最小可交付范围修改代码、模板、测试和文档。
4. 记录：CLI 行为、模板契约、生成产物、项目结构或公共接口变化，新增 `changes/*.md`。
5. 验证：运行与影响面匹配的构建、测试、manifest 或文档检查。
6. 收尾：必要时更新 `docs/tech/todo-archive.md`，通过验证后创建本地 commit，不主动 push。

## 7. 待办与文档规则

- 普通修复、文案更新、小范围模板调整不需要新建路线图。
- 长期增强、多批次功能或体验重做，先按 `docs/tech/todo-governance.md` 建立专题 roadmap，再登记到 `docs/tech/todo-index.md`。
- 路线完成后，归档到 `docs/tech/todo-archive.md`，并从活跃入口移除。
- README 只描述真实可用能力和当前推荐用法。
- 技术决策优先记录在 `docs/tech/`，文件名使用英文 kebab-case。

## 8. 验证策略

- TypeScript 代码变更：至少运行 `npm run build`，并运行相关 `vitest` 测试。
- CLI 行为变更：运行相关单测或 `npm run test:smoke`。
- 模板、命令 renderer 或生成产物变化：运行 `npm run build:commands`、`npm run check:command-manifest`，必要时更新 manifest。
- changeset 变化：运行 `npm run check:changes`。
- 文档-only 变更：至少运行 `git diff --check`，并人工检查路径、术语和链接一致性。
- 大范围收尾或发布前：运行 `npm run verify`。

## 9. 兼容与迁移

- 默认保护用户已有 `stories/`、`spec/tracking/`、`spec/knowledge/`、`.specify/memory/` 内容。
- 升级逻辑不得无提示覆盖用户正文、正典资料、追踪数据或个人创作原则。
- 删除旧入口时，应同步错误提示、迁移说明和测试期望。
- 迁移文档只描述真实可执行路径，不承诺未实现的自动迁移能力。

## 10. Skill 与资料使用

- 归档 skill 只在用户明确要求或任务确实需要时加载，并在最终说明中写明使用了哪些 skill。
- 对外部框架、库、CLI API 的新写法，必要时查阅官方文档；纯内部类型、重命名和领域模型不强制联网。
- 非必要不联网；仓库代码、项目 SDD、AGENTS 和当前文档是本项目维护的主要事实源。

## 11. 提交规则

- 完成明确代码或文档修改并通过必要验证后，创建本地 commit。
- commit message 使用中文，描述本次变更的用户可见结果或维护结果。
- 不主动 push。
