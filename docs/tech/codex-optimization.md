# Codex 适配优化记录

## 背景

Novel Writer 已能为 Codex 生成 `.codex/prompts/novel-*.md`，但 Codex 接手项目时缺少一个可快速判断“当前能否直接写”的状态入口，也缺少面向代理的轻量项目边界说明。复杂小说项目中，规格、计划、任务、追踪 JSON 和正文分散在多个目录，容易出现规划未完成就开始写正文、或写作任务不知道允许改哪些文件的问题。

## 目标

- 增加 `novel status`，输出 AI agent 接手项目前需要检查的最小状态；`novel codex-status` 保留为兼容别名。
- 在 `novel init --ai codex` 或 `--all` 时生成根目录 `AGENTS.md`，说明流程、读取顺序和写作边界，并支持 `--agents-profile` 注入成人向、慢热、冒险、恋爱、多线叙事等边界画像。
- 强化任务模板，让 `/novel-tasks` 生成的任务包含必须读取、允许修改、禁止事项和验收标准。
- 强化世界观模板，覆盖能力体系、生物物种、势力范围和高风险剧情节点。

## 非目标

- 不改变现有 slash prompt 的命名规则：Codex 仍使用 `/novel-命令名`。
- 不覆盖已有用户项目根目录的 `AGENTS.md`。
- 不把成人或高风险节点展开成正文，只在计划和任务中保留剧情功能、关系变化、后果和边界。

## 设计

- `src/application/get-project-status.ts` 读取 `.specify/config.json`、`stories/*`、`spec/tracking/*.json` 和 `git status --short`，默认输出人类可读摘要，`--json` 输出结构化结果。
- `src/utils/project.ts` 扩展 AI 配置检测，纳入 Codex、Copilot、Qwen、OpenCode 等已支持平台。
- `templates/AGENTS.codex.md` 作为新项目模板，由 `initProject` 在 Codex 目标项目中复制为 `AGENTS.md`，并渲染 `{{AGENTS_PROFILE_SECTION}}`。
- `templates/commands/tasks.md` 和 `templates/commands/write.md` 增加任务边界字段，避免 Codex 在规划阶段误写正文。
- `scripts/build-commands.cjs` 和 `scripts/postbuild.cjs` 替代 npm scripts 中的裸 `bash` / `chmod` 调用，使 Windows 环境可以完成构建验证。

## 验证计划

- 运行 `npm run build` 检查 TypeScript。
- 运行 `npm run build:commands` 检查多平台 prompt 构建。
- 运行 `node dist/cli.js status --json` 做 CLI 冒烟验证。
- 使用临时目录运行 `node dist/cli.js init smoke --ai codex --method three-act --no-git`，确认生成 `.codex/prompts/` 与 `AGENTS.md`。
