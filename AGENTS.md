# Agent 协作说明

## 语言与姿态

- 默认使用中文回复；代码名、命令名、参数名可保留 English。
- 先给结论和可执行结果，再补必要原因。
- 修改前先定位相关文件，避免无目的全仓库扫描。

## 包管理与常用命令

- `bun.lock` 是锁文件；需要安装依赖时优先使用 `bun install`。
- 贡献者命令以 npm scripts 为准，不新增 `package-lock.json`，除非明确迁移包管理器。

| 任务 | 命令 |
| --- | --- |
| TypeScript 构建 | `npm run build` |
| 生成 agent 命令产物 | `npm run build:commands` |
| manifest 检查 | `npm run check:command-manifest` |
| changeset 检查 | `npm run check:changes` |
| 单元测试 | `npm test` |
| 冒烟测试 | `npm run test:smoke` |
| 完整验证 | `npm run verify` |
| CLI 帮助冒烟 | `node dist/cli.js --help` |
| Codex 状态冒烟 | `node dist/cli.js codex-status --json` |

## 关键源目录

- `src/`：CLI、应用服务、领域模型、校验和 agent 集成源代码。
- `templates/commands/*.md`：生成 slash prompt 和 Markdown command 的源模板。
- `templates/`：用户项目 `.specify/templates/` 和 `spec/*` 初始化模板源。
- `scripts/`：用户项目 `.specify/scripts/` 的脚本源。
- `memory/`：用户项目 `.specify/memory/` 的初始化模板源。
- `spec/presets/`：内置写作方法预设。
- `plugins/`：可选插件、扩展命令和知识包。
- `dist/`：构建产物，不手工编辑。

## 生成目录边界

- 根目录 `.specify/`、`stories/`、`spec/tracking/`、`.claude/`、`.codex/` 是本地生成物或用户项目数据，不作为仓库源目录。
- 用户项目数据位于 `stories/`、`spec/tracking/`、`spec/knowledge/`、`.specify/memory/`；升级时避免覆盖。
- 修改模板或命令 renderer 后，运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 修改生成产物期望时，同步 `tests/fixtures/command-artifacts.manifest.json`。

## Agent 与命令约定

- `src/agent/registry.ts` 是 agent ID、安装目录、renderer、能力和 slash prefix 的主要事实源。
- `src/utils/ai-platforms.ts` 仅保留 legacy `--ai` 兼容层。
- `templates/commands/*.md` 是命令内容源；不要手工改 `dist/<agent>/`。
- Codex prompts 是 `.codex/prompts/storyspec-*.md` 形式的纯 Markdown。
- Gemini 使用薄适配层；核心协作规则仍来自通用 agent contract 和命令模板。

## 文档与记录

- CLI 行为、模板契约、生成产物、项目结构或公共接口变化，新增 `changes/*.md`。
- 长期路线才登记到 `docs/tech/todo-index.md`；完成后归档到 `docs/tech/todo-archive.md`。
- 重要维护规则以 `SDD.md` 为准。
- README 只写真实可用能力，不提前承诺未实现功能。

## 创作控制权

- StorySpec 应帮助作者澄清选择，而不是替作者过早定案。
- 涉及世界观、角色关系、主题、正典事实、感情推进等高影响内容时，优先保留作者确认、来源追踪和 preview / confirm / apply 流程。
- 示例用于启发和分叉，不应变成唯一答案。
