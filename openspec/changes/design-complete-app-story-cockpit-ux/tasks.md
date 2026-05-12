## S. 共享契约

- [x] S.1 确认首版产品优先级：作者 + 团队平衡。
- [x] S.2 确认首版信息架构：故事驾驶舱居中。
- [x] S.3 确认首批页面范围：项目/工作区入口作为 App shell 必备入口；故事内主页面为故事驾驶舱、章节与写作、候选与正典审阅、任务中心。
- [x] S.4 确认高影响内容默认走 Preview / Confirm / Apply。
- [x] S.5 确认视觉方向：工作室控制台。

## P. 实现任务

- [x] P.1 编写完整 App UX 设计规格。
  - May edit: `docs/superpowers/specs/2026-05-12-complete-app-story-cockpit-ux-design.md`
  - Must not edit: `src/**`, `dist/**`
  - Depends on: S.1, S.2, S.3, S.4, S.5
  - Validation: 设计规格必须覆盖产品定位、用户角色、信息架构、首批页面、核心流程、状态语言、权限反馈、视觉方向、响应式边界、空状态和验收标准。

- [x] P.2 同步产品体验路线图和待办入口。
  - May edit: `docs/tech/app-ux-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: `README.md`, `dist/**`
  - Depends on: P.1
  - Validation: 路线图必须明确设计规格已确认但功能未实现。

- [x] P.3 补齐 OpenSpec 设计记录。
  - May edit: `openspec/changes/design-complete-app-story-cockpit-ux/**`
  - Must not edit: `openspec/changes/*` 的其他 change
  - Depends on: P.1, P.2
  - Validation: `proposal.md`、`design.md`、`tasks.md` 和 `specs/complete-app-ux/spec.md` 均存在，且没有把未实现能力写成已实现。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate design-complete-app-story-cockpit-ux --strict --json --no-interactive`。
- [x] V.2 运行文档差异检查：`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
