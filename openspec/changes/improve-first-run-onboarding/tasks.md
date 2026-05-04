# improve-first-run-onboarding 任务

## S. 串行共享契约

- [ ] S1. 对齐首程状态模型
  - May edit: `src/application/story-onboarding.ts`、相关 domain/type 文件、对应 unit tests。
  - Must not edit: `dist/**`、其他 OpenSpec change 目录、用户项目数据目录。
  - Depends on: 本 change 的 `workspace-preflight`、`source-material-onboarding`、`low-command-navigation` specs 已通过 review。
  - Validation: 新增或更新测试，覆盖非工作区、空工作区、新故事、已有素材四类状态。

- [ ] S2. 定义稳定 JSON action 契约
  - May edit: CLI/application 输出类型、`--json` snapshot fixtures、agent 消费所需 contract 文档。
  - Must not edit: 与首程无关的 CLI action、公共数据模型迁移、`dist/**`。
  - Depends on: S1。
  - Validation: `npm test` 中的 JSON snapshot 必须证明 action 可由 agent/UI 使用，且人类文案变化不影响 action 字段。

- [ ] S3. 固定 preview / confirm / apply 边界
  - May edit: ingest/co-create/preview 相关测试、clarification/candidate contract 文档。
  - Must not edit: 自动确认候选的实现、正典写入规则以外的写作流程。
  - Depends on: S1。
  - Validation: 测试必须证明长文候选、表格映射候选和 AI 推断不会在未确认时写入 confirmed/canon/specification。

## P. 可并行任务

- [ ] P1. 实现工作区 preflight 首程
  - May edit: `src/application/init-project.ts`、`src/cli/commands/init.command.ts`、`src/utils/project.ts`、相关 CLI smoke/unit tests、首程 agent prompt 模板。
  - Must not edit: unrelated CLI commands、`dist/**`、其他 change 目录。
  - Depends on: S1。
  - Validation: 在非 StorySpec 目录触发创作入口时，输出只要求工作区路径；用户提供路径后可直接初始化；初始化成功后显示素材分流。

- [x] P2. 实现原始灵感和长文资料输入向导
  - May edit: `src/application/story-onboarding.ts`、`src/application/ingest-story-input.ts`、`src/application/co-create-workbench.ts`、`src/application/creative-report.ts`、相关 fixtures/snapshots。
  - Must not edit: 正文生成流程、章节任务系统、`dist/**`。
  - Depends on: S1、S3。
  - Validation: 覆盖一句灵感 20-200 字、首轮长文 500-3000 字、超长资料分段建议；输出包含可复制示例、核心要点清单和“待澄清不是失败”的解释。

- [x] P3. 实现 Markdown 表格资料 onboarding
  - May edit: ingest/co-create 输入解析、表格导入预览、clarification reason 输出、相关 unit fixtures。
  - Must not edit: 数据库/存储架构、非 onboarding 的表格工具、`dist/**`。
  - Depends on: S1、S3。
  - Validation: Markdown 表格输入能展示已识别列、未识别列和字段映射候选；未确认表格内容不得 apply 为正典。

- [ ] P4. 实现少命令化 `next`/首屏导航
  - May edit: `src/application/get-project-status.ts`、`src/application/story-onboarding.ts`、`src/cli/program.ts`、`templates/commands/*.md`、相关 tests。
  - Must not edit: 高级命令删除或重命名、`dist/**` 手工编辑。
  - Depends on: S1、S2。
  - Validation: 空项目或新故事阶段第一屏展示 3-5 个自然语言入口；命令位于次级 copyable command 区域；`--json` 输出稳定 action。

- [ ] P5. 同步作者文档和 agent guide
  - May edit: `README.md`、`docs/quickstart.md`、`agent-guides/story-creation-guide.md`、必要 changeset。
  - Must not edit: 长期 todo、已归档 roadmap、`dist/**`。
  - Depends on: P1、P2、P4 的行为确定。
  - Validation: 文档中的首次路径与 CLI/agent 首屏一致，不承诺未实现能力。

- [ ] P6. 更新命令产物和 manifest
  - May edit: 由 `npm run build:commands` 生成的命令产物、`tests/fixtures/command-artifacts.manifest.json`。
  - Must not edit: 手工改 `dist/**`、无关 fixture。
  - Depends on: P4、P5。
  - Validation: `npm run build:commands`、`npm run check:command-manifest` 通过；若产物变化，manifest 同步。

## V. 集成验证

- [ ] V1. 运行首程单元和 snapshot 测试
  - May edit: 仅修复与本 change 直接相关的 tests/fixtures。
  - Must not edit: 源码重构、其他 change 目录。
  - Depends on: P1-P4。
  - Validation: `npm test` 通过，或记录与本 change 无关的已知失败。

- [ ] V2. 运行 CLI 冒烟
  - May edit: 仅修复本 change 引入的 CLI 输出或 fixture 问题。
  - Must not edit: `dist/**` 手工编辑。
  - Depends on: P6。
  - Validation: `npm run build`、`npm run test:smoke`、`node dist/cli.js --help`、`node dist/cli.js codex-status --json` 通过。

- [x] V3. 验证确认流安全
  - May edit: 与 preview/confirm/apply 相关的 focused tests。
  - Must not edit: 放宽确认门槛、自动写入正典。
  - Depends on: P2、P3。
  - Validation: 手动或自动场景证明长文候选、AI 推断和表格映射在未确认时只出现在 preview/candidate/clarification 区域。

- [ ] V4. 最终仓库检查
  - May edit: 仅修复文档格式、manifest 或 fixture drift。
  - Must not edit: unrelated files、其他 worker 的 change 目录。
  - Depends on: V1-V3。
  - Validation: `git diff --check` 通过；变更文件列表只包含本 change 所需文件和经实现任务允许的文件。
