# Tasks: 改进写作反馈闭环

## S. 串行共享契约

- [x] S1. 确认输出契约命名和 stage 枚举
  - May edit: `src/domain/*`、`src/application/*` 中与输出 DTO 或 report 类型直接相关的文件；`templates/commands/*.md`
  - Must not edit: `dist/**` 手工产物、用户故事数据、其他 OpenSpec change 目录
  - Depends on: 本 change 的三个 spec 审阅通过
  - Validation: 新增或更新契约测试，覆盖 `plan`、`write`、`finish` 三类 stage

- [x] S2. 定义 JSON 与人类文本的兼容边界
  - May edit: CLI 输出 formatter、相关 application result 类型、命令模板
  - Must not edit: GUI 或 Web 工作台相关新目录
  - Depends on: S1
  - Validation: `--json` fixture 不依赖中文文案解析；人类输出不超过一屏核心摘要

- [x] S3. 更新变更记录和命令产物同步规则
  - May edit: `changes/*.md`、命令模板源、manifest fixture
  - Must not edit: `dist/**` 手工编辑
  - Depends on: 任一 CLI 行为或模板契约发生变化
  - Validation: `npm run build:commands`、`npm run check:command-manifest`

## P. 可并行实现任务

- [x] P1. 实现章节阶段性反馈契约
  - May edit: `templates/commands/write.md`、`templates/commands/write.prompt.md`、写章/draft/task finish 相关 application 层、对应 tests
  - Must not edit: 计划摘要和 context pack 以外的无关命令；用户故事正文
  - Depends on: S1
  - Validation: 写章 smoke 或 snapshot 证明开始阶段输出 3-6 条 scene beat，正文阶段至少一次分块进度，收尾阶段输出验证摘要

- [x] P2. 实现 task/chapter scope 的 context pack
  - May edit: `src/application/manage-context-packs.ts`、context pack CLI command、handoff 集成、对应 tests
  - Must not edit: tracking schema 迁移、GUI、其他 change 目录
  - Depends on: S1
  - Validation: unit tests 覆盖 `--task <id>`、`--chapter <n>`、资料不足 warning、Windows story-relative 路径

- [x] P3. 实现卷计划一屏摘要
  - May edit: `src/application/creative-report.ts`、`src/application/preview-apply.ts`、creative plan report 类型、对应 tests
  - Must not edit: 正文生成逻辑、context pack scope 逻辑
  - Depends on: S1
  - Validation: fixture 覆盖三幕结构、12 章节奏、角色弧线、剧情起伏、人物关系；缺失字段显示待确认

- [x] P4. 增加 Markdown/Mermaid 视图输出能力
  - May edit: creative report / story map 输出模块、Markdown renderer、Mermaid text fixture
  - Must not edit: GUI、外部图形依赖、正典写入逻辑
  - Depends on: P3
  - Validation: 输出的 Mermaid 文本可复制到支持 Mermaid 的 Markdown 环境；资料不足时显示缺口

- [x] P5. 补充 author-first dogfood fixtures
  - May edit: `tests/fixtures/**`、相关 unit/smoke tests
  - Must not edit: `stories/**`、真实用户项目数据
  - Depends on: P1、P2、P3 可分别独立补充 fixture
  - Validation: fixture 不包含真实正文，能稳定复现首章/第二章等待反馈、章节 scope pack、卷计划摘要

## V. 集成验证

- [x] V1. 运行相关单元测试
  - Command: `npm test -- --runInBand`
  - Expected: 章节反馈、context pack scope、计划摘要相关测试通过

- [x] V2. 运行命令产物检查
  - Command: `npm run build:commands && npm run check:command-manifest`
  - Expected: command templates 与 manifest 同步，无手工 dist 漂移

- [x] V3. 运行 CLI 冒烟测试
  - Command: `npm run test:smoke`
  - Expected: 写章、context pack、creative report 的帮助页或快照不回归

- [x] V4. 运行完整验证
  - Command: `npm run verify`
  - Expected: 构建、测试、manifest、changeset 检查通过

- [x] V5. 文档-only 或 artifact-only 收尾检查
  - Command: `git diff --check -- openspec/changes/improve-writing-feedback-loop`
  - Expected: 无尾随空格、无 patch 格式错误
