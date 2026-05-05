# StorySpec 生态与类型包增强路线图

## 状态

Completed。本文归档插件、extension、preset、reviewer 权重和类型包相关增强；后续生态增强应回到 [todo-index.md](../../todo-index.md) 新建专题路线，且实现前按影响范围转为 OpenSpec change。

## 背景和目标

StorySpec 已有插件安装底座、preset 命令、genre preset 第一版和 reviewer loop。归档记录中仍保留类型 preset 扩展、reviewer 权重接入和 `extension:add` 薄 alias 等未来能力。目标是把这些生态增强集中成一条可排期路线。

## 非目标

- 不引入远程 marketplace。
- 不让 preset 覆盖作者已有正文、世界观或正典。
- 不把 alias 做成独立实现；必须复用现有 install plan。
- 不在 README 中承诺尚未实现的类型包。

## P0 安装入口一致性

### P0-1 `extension:add` 薄 alias

- [x] 状态：完成（2026-05-05）。`extension:add <name>` 已作为 `plugins:add` 的语义化薄 alias 接入，复用同一个 resolve / install plan / dry-run renderer / apply 行为；dry-run 输出 manifest kind、写入路径、agent impact 和冲突诊断。验证见 OpenSpec `openspec/changes/add-extension-add-alias` 和 changeset `changes/2026-05-05-extension-add-alias.md`。
- 类型：CLI 入口、插件安装、安全预览
- 背景/问题：ADR 已允许未来新增 `extension:add <name>` 作为 `plugins:add` 的语义化薄 alias，但要求复用同一个 install plan 和 dry-run renderer。
- 已有基础：`plugins:add --dry-run`、`PluginManifest.kind`、插件安装计划和冲突路径诊断。
- 缺口：缺少 Commander 子命令、help 文档、错误提示一致性和 smoke 覆盖。
- 建议方案：新增 `extension:add <name>`，内部调用现有插件安装逻辑；只在展示层强调 kind 为 extension。
- 下一次开发入口：新建 OpenSpec change `add-extension-add-alias`，先把 `plugins:add` 的解析、plan 和 dry-run 渲染抽成可复用函数，再注册 `extension:add <name>`；第一版只允许安装 manifest `kind: extension` 或在输出中明确当前 kind，行为仍复用同一 install plan。
- 涉及文件/模块：`src/cli/commands/plugins.command.ts`、插件安装应用服务、`docs/commands.md`、`README.md`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/decisions/plugin-entrypoint-decision.md`。
- OpenSpec 输入：`proposal.md` 说明 alias 不新增 registry；`design.md` 写清 command handler 复用边界、dry-run 文案差异和非 extension manifest 的提示口径；`tasks.md` 包含 help/smoke、dry-run JSON 或文本快照、README/commands 文档同步。
- 验收标准：`extension:add --dry-run` 输出 manifest kind、agent impact、冲突路径和最终来源诊断；行为与 `plugins:add` 保持一致；不存在重复安装逻辑。
- 验收命令：`npm run build`、新增/相关 plugin install unit、相关 CLI smoke、`node dist/cli.js --help`、`node dist/cli.js extension:add --help`、`npm run check:changes`、`git diff --check`。
- 不做/边界：不新增 marketplace、远程索引或独立 extension registry。

## P1 类型包和 reviewer

### P1-1 新增类型 preset 包扩展批次

- [x] 状态：完成（2026-05-05）。首个新增类型 preset 垂直切片选择 `mystery`，已提供 manifest、README、命令增强提示、world 模板和 reviewer config；`preset:list` 可发现，`preset:add mystery` 可安装，`preset:doctor` 和 `validate` 可通过。验证见 OpenSpec `openspec/changes/add-first-genre-preset-slice` 和 changeset `changes/2026-05-05-mystery-genre-preset.md`。
- 类型：preset、题材知识、模板
- 背景/问题：Worldbuilding 路线归档后明确提到后续可新增 `court-intrigue`、`urban-fantasy`、`mystery`、`romance-slow-burn` 等类型包。
- 已有基础：`preset:list`、`preset:add`、`preset:doctor`、`spec/presets/`、genre preset manifest。
- 缺口：缺少新类型包的最小字段、安装验收、示例边界和不污染作者正典的规则。
- 建议方案：先选一个类型包作为垂直切片，定义 preset manifest、clarification questions、world / rhythm / style defaults，再扩展其他类型。
- 下一次开发入口：新建 OpenSpec change `add-first-genre-preset-slice`，先选择一个垂直切片，例如 `mystery` 或 `romance-slow-burn`；先冻结 preset manifest 必填字段、安装产物清单和不覆盖规则，再补 `presets/<id>/preset.yaml`、`spec/` 模板、澄清问题包和 doctor fixture。
- 涉及文件/模块：`spec/presets/`、`templates/clarification/`、`src/application/manage-presets.ts`、`tests/unit/manage-presets.test.ts`、文档。
- 参考资料：`docs/tech/archive/full-refactor/full-refactor-worldbuilding.md`、`docs/tech/archive/completed-roadmaps/worldbuilding-quality-roadmap.md`；现有 `presets/*/preset.yaml` 和 `manage-presets.ts` 的安装/doctor 口径。
- OpenSpec 输入：`design.md` 列出新 preset 的文件树、来源标记、示例边界、requiredWorldFacts 与 reviewerWeights 默认值；明确安装只写 `.specify/presets/<id>`、`spec/presets/current-preset.json` 和未存在的 spec 模板。
- 验收标准：至少一个新增类型包可被 `preset:list` 发现、`preset:add` 安装、`preset:doctor` 校验；不会覆盖项目已有作者内容；文档写明适用和不适用场景。
- 验收命令：`npm run build`、`npx vitest run tests/unit/manage-presets.test.ts tests/unit/preset-manifest.test.ts`、相关 CLI smoke、`npm run check:changes`、`git diff --check`。
- 不做/边界：不把类型包变成自动剧情生成器。

### P1-2 Reviewer 权重接入

- [x] 状态：完成（2026-05-05）。`storyspec review` 已读取项目级 `spec/reviewer-config.json` 和 active preset manifest 的 `reviewerWeights`；项目级配置优先于 preset，未配置时默认权重为 1。review JSON 每个 reviewer 输出 `weight` 和 `weightSource`，文本报告也显示来源。验证见 OpenSpec `openspec/changes/apply-reviewer-weights` 和 changeset `changes/2026-05-05-reviewer-weights.md`。
- 类型：reviewer loop、配置、类型适配
- 背景/问题：第一版 reviewer loop 已完成，但归档记录保留了 reviewer 权重接入，便于不同类型故事调整检查重点。
- 已有基础：`storyspec review`、reviewer loop、genre preset 记录、创作控制权规则。
- 缺口：缺少权重配置 schema、默认权重、preset 覆盖策略和 explain 输出。
- 建议方案：新增 reviewer weight config，允许 preset 提供建议权重；review 输出中展示权重来源和影响。
- 下一次开发入口：新建 OpenSpec change `apply-reviewer-weights`，先把 `PresetManifest.reviewerWeights` 从“可解析但未使用”接入 review score；定义默认权重为 1，项目配置优先于 preset，review JSON 输出 `weight` 和 `weightSource`。
- 涉及文件/模块：`src/application/review*`、`spec/presets/`、`templates/`、`tests/unit/review-project.test.ts`。
- 参考资料：`docs/tech/archive/completed-roadmaps/worldbuilding-quality-roadmap.md`；`src/domain/preset-manifest.ts` 已有 `reviewerWeights` schema；`src/application/review-project.ts` 当前 `scoreReviewer` 尚未读取权重。
- OpenSpec 输入：写清权重只影响排序、分数或显示优先级中的哪一层；如果调整 score 公式，需保留未配置时输出完全兼容；如果新增项目级配置，先定义路径和迁移默认值。
- 验收标准：reviewer 可以读取项目或 preset 权重；JSON 输出包含权重来源；未配置时保持当前默认行为。
- 验收命令：`npm run build`、`npx vitest run tests/unit/review-project.test.ts tests/unit/preset-manifest.test.ts`、相关 smoke、`npm run check:changes`、`git diff --check`。
- 不做/边界：权重只影响检查优先级和展示，不自动修改正文。

## P2 生态诊断与文档

### P2-1 插件、preset、extension 展示口径统一

- [x] 状态：完成（2026-05-05）。插件/extension dry-run 和安装摘要已显示中文包类型与 raw kind，例如 `包类型: 扩展包 (extension)`；安装影响文案统一展示写入、agent integration 和冲突诊断。`preset:list` / `preset:doctor` 文本输出已标明 genre preset 是“类型包”。验证见 OpenSpec `openspec/changes/align-ecosystem-kind-copy` 和 changeset `changes/2026-05-05-ecosystem-kind-copy.md`。
- 类型：文档、CLI 诊断、用户体验
- 背景/问题：生态包已有多种 kind，未来新增 alias 和类型包后，需要避免用户混淆“插件包 / preset 包 / extension 包”。
- 已有基础：`PluginManifest.kind`、`plugins:add --dry-run`、`preset:*` 命令。
- 缺口：缺少统一展示文案、错误提示和 docs 导航。
- 建议方案：统一 dry-run renderer 的 kind 文案；在 `docs/commands.md` 和 README 中只写真实可用入口；未来 alias 未实现前继续标为待办。
- 下一次开发入口：跟随 `extension:add` 或首个新增类型 preset 后开小型 OpenSpec/文档 change `align-ecosystem-kind-copy`；先盘点 `plugins:add --dry-run`、`preset:list/add/doctor`、未来 `extension:add` 的输出字段，再统一 kind 中文名和冲突提示。
- 涉及文件/模块：插件安装 renderer、`docs/commands.md`、`README.md`、`tests/unit/plugin-install-plan.test.ts`。
- 参考资料：`docs/tech/archive/decisions/plugin-entrypoint-decision.md`。
- OpenSpec 输入：列出现有输出样例和目标输出样例；标记 README 只能写已实现命令，未实现 alias 只能出现在 roadmap。
- 验收标准：用户能从 help 和 dry-run 判断包类型、安装影响、冲突路径和来源；未实现 alias 不出现在可用命令表中。
- 验收命令：`npm run build`、相关 renderer unit、CLI help smoke、`npm run check:changes`、`git diff --check`。
- 不做/边界：不引入外部包发现服务。

## 完成同步

- CLI 行为变化新增 changeset。
- 新增 preset 或插件产物时补单测、smoke 和文档。
- 完成后更新本文状态并归档到 `todo-archive.md`。
