# 重构公共验证与风险清单

## 状态

Active planning。本文保存 A/B/C 三条路线共用的验证矩阵、风险与缓解、第一批建议开发任务和参考链接。

## 验证矩阵

| 场景 | 命令 |
|------|------|
| 类型检查 | `npm run build` |
| 单元测试 | `npm test` |
| CLI smoke | `npm run test:smoke` |
| 生成产物 | `npm run build:commands` |
| 生成产物一致性 | `npm run check:command-manifest` |
| 完整验证 | `npm run verify` |
| generic 初始化 | `node dist/cli.js init smoke --agent generic --no-git` |
| Codex 兼容初始化 | `node dist/cli.js init smoke --ai codex --no-git` |
| agent doctor | `node dist/cli.js agent:doctor --json` |
| 世界观校验 | `node dist/cli.js world:check --json` |
| Canon 校验 | `node dist/cli.js canon:check --json` |
| 场景校验 | `node dist/cli.js scene:check --json` |
| 审稿面板 | `node dist/cli.js review --json` |
| 上下文包 | `node dist/cli.js context:pack --task T001 --json` |
| 草稿列表 | `node dist/cli.js draft:list --chapter 003 --json` |
| 叙事测试 | `node dist/cli.js narrative:test --chapter 003 --json` |
| 风格检查 | `node dist/cli.js style:lint --chapter 003 --json` |
| 编译导出 | `node dist/cli.js compile --format markdown` |

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 术语迁移导致用户困惑 | `--ai` 保留兼容；README 给出“agent/integration 是新名称”的说明 |
| `AGENTS.md` 泛化后 Codex 体验变弱 | 通用 contract + Codex profile 增强分层输出 |
| generic command 与 slash command 漂移 | 单一 CommandSpec，多 renderer 输出 |
| 插件系统再次分裂 | 插件先注册 command/template 能力，再由 renderer 输出 |
| 旧项目 upgrade 覆盖用户内容 | plan/apply、backup、dry-run、validate、只覆盖生成产物 |
| 支持任意 agent 范围过大 | 分层能力支持，不承诺所有 agent 都有同等自动化体验 |
| World Bible 变成无用百科 | 每条 WorldFact 必填 storyFunction 和 constraints |
| Canon 维护成本过高 | 写作完成只生成待确认事实和 debt，人工确认后入账 |
| Entity Graph 误推断 | 第一版只用显式 evidencePaths，不把 AI 推断当事实 |
| Scene Cards 增加写作摩擦 | 旧项目可选启用，章节任务仍可直接写作 |
| Reviewer Loop 变成泛泛而谈 | findings 必须带 path、evidence、severity、suggestedAction |
| Context Pack 过大失去意义 | 每个 mustRead 必须有 reason，pack 有过期检查 |
| 草稿层导致文件混乱 | DraftRecord 统一记录状态，promote 才进入 content |
| 分支探索污染主线 | branch 默认写 branches 目录，promote 必须确认 |
| Style Linter 压制作者风格 | 规则可配置、可降级、可按 preset override |
| Feedback 导致任务膨胀 | feedback 先 triage，再生成任务草稿 |

## 共享任务批次映射

- [x] Shared-S1：Agent-neutral 基线。

  覆盖原 N001-N006。已完成 agent-neutral ADR、agent registry/capabilities、generic integration、`agent:list`、agent contract 模板与 generic init smoke fixture。

- [x] Shared-S2：Agent 文档收口。

  覆盖原 N007。已并入 [full-refactor-agent-neutral.md](full-refactor-agent-neutral.md) 的 Batch A2，README 主叙事已改为 agent-neutral，Codex 作为示例 integration。

- [x] Shared-S3：World / Canon 基座。

  覆盖原 N008-N011。已并入 [full-refactor-worldbuilding.md](full-refactor-worldbuilding.md) 的 Batch B0，完成 worldbuilding roadmap、WorldFact / CanonFact schema、world/canon 模板、基础 CLI 与 validate issue 格式。

- [ ] Shared-S4：Workbench 基座。

  覆盖原 N012-N015。并入 [full-refactor-workbench.md](full-refactor-workbench.md) 的 Batch C0，目标是 workbench ADR、ContextPack / DraftRecord / NarrativeTestResult schema、context pack MVP 与 draft/revision 布局。

## 历史归档

上一轮全面重构已完成，归档信息见 [full-refactor-archive.md](full-refactor-archive.md)。本文件只保留当前 agent-neutral 重构的活跃计划。

## 参考链接

- Spec Kit：<https://github.com/github/spec-kit>
- Spec Kit integrations：<https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md>
- AGENTS.md：<https://github.com/agentsmd/agents.md>
- Continue：<https://github.com/continuedev/continue>
- OpenHands：<https://github.com/OpenHands/OpenHands>
- Cline：<https://github.com/cline/cline>
- Aider：<https://github.com/Aider-AI/aider>
