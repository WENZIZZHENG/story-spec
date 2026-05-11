# 平台地基与发布边界路线图

## 状态

Completed。本文承接完整 App 路线中的 P0 地基任务；依赖、构建、命令产物和文档事实边界已完成本轮收口，后续多人平台开发可从 App UX 与 API contract 继续推进。

## 继承边界

- 不新增产品能力。
- 不把未实现的多人、云端、富文本或真实 worker 能力写成已可用。
- 不手工提交完整 `dist`。
- 涉及 CLI 行为、公共接口、模板契约或生成产物变化时，按项目规则新增 `changes/*.md`。

## P0-1 依赖安装与 CI 可复现性（Completed）

- 类型：构建、CI、依赖治理
- 背景/问题：仓库锁文件是 `bun.lock`，但 CI 当前使用 `npm install --package-lock=false --ignore-scripts`，无法真正锁定依赖版本；本地也可能在 Node/npm 版本差异下装出不同依赖树。
- 已有基础：`bun.lock`、`.github/workflows/ci.yml`、`package.json` npm scripts、Node 20/22 CI 矩阵。
- 缺口：缺少明确的包管理器决策和 frozen install 验证；`npm audit` 在无 package-lock 时无法直接运行。
- 建议方案：
  1. 在 OpenSpec 中先确认包管理策略：继续 Bun lockfile，或迁移到 npm lockfile。
  2. 若继续 Bun，CI 改为安装 Bun 并使用 frozen lockfile；若迁移 npm，则生成并提交 `package-lock.json`，同时调整项目级 AGENTS 约定。
  3. 增加依赖安全检查策略，明确用 npm audit、bun audit 或第三方扫描。
- 涉及文件/模块：`.github/workflows/ci.yml`、`package.json`、`bun.lock`、可能新增 `package-lock.json`、`docs/local-development.md`、`AGENTS.md`。
- 验收标准：CI 和本地安装使用同一锁定策略；全新 checkout 能在 Ubuntu/Windows、Node 20/22 下稳定通过 `npm run verify` 或等价命令；安全扫描命令有文档入口。
- 参考项目/资料：npm / Bun 官方 install 与 lockfile 文档；当前仓库 CI。
- 不做/边界：本任务不升级依赖 major，不改变业务代码。
- 完成记录：`align-ci-bun-lockfile` 已让 CI 使用 `.bun-version` 和 `bun install --frozen-lockfile`，本地开发文档同步说明 `bun.lock` 策略，并新增 CI workflow 单测防止回退到无锁 npm install。

## P0-2 命令产物与 compiled runtime 分离（Completed）

- 类型：构建、生成产物、验证链路
- 背景/问题：单独运行 `npm run build:commands` 会重建 ignored `dist/` 并移除 `dist/cli.js`、runtime bundle；随后直接运行 `npm run check:command-manifest` 会因为 manifest 生成依赖当前 compiled runtime 而失败。`verify` 通过二次 `npm run build` 规避了问题，但单独命令顺序容易踩坑。
- 已有基础：`src/prompt/build-commands.ts`、`scripts/build/command-artifact-manifest.ts`、`docs/local-development.md` 已提醒 smoke 前重跑 build。
- 缺口：命令产物输出目录和 TypeScript 编译产物耦合在 `dist/`；manifest 检查依赖临时状态。
- 建议方案：
  1. 将 agent command artifacts 输出到独立目录，例如 `dist-command-artifacts/` 或 `dist/agents/`，避免删除 compiled runtime。
  2. 或让 `build:commands` 先保留 runtime bundle，再清理 agent 子目录。
  3. 更新 manifest 检查，使其从确定的 build 输出读取 runtime，而不是依赖刚被重建的 `dist` 状态。
  4. 同步 `prepare`、`prepublishOnly`、README 和本地开发文档。
- 涉及文件/模块：`src/prompt/build-commands.ts`、`scripts/build/build-commands.ts`、`scripts/build/command-artifact-manifest.ts`、`package.json`、`docs/local-development.md`、`docs/tech/architecture.md`、相关 unit/smoke。
- 验收标准：任意顺序运行 `npm run build`、`npm run build:commands`、`npm run check:command-manifest` 不会因 compiled runtime 被删除而失败；`node dist/cli.js --help` 在推荐构建路径后可用；manifest 变化仍可被捕获。
- 参考项目/资料：当前 `verify` 顺序和 `docs/local-development.md` 的手工规避说明。
- 不做/边界：不手工提交完整 `dist`。
- 完成记录：`preserve-runtime-when-building-commands` 已让默认 `build:commands` 只清理已知 agent 子目录，保留 `dist/cli.js` 和 compiled runtime；自定义 `outDir` 仍完整清理，manifest 检查保持可复现。

## P0-3 README 高频命令去重与事实边界巡检（Completed）

- 类型：文档、事实源
- 背景/问题：README 高频命令表中 `storyspec server` 出现重复行；这不影响功能，但会削弱“文档只讲真实可用能力”的可信度。
- 已有基础：`README.md`、`docs/commands.md`、`docs/tech/todo-index.md`、`docs/tech/todo-archive.md` 已有事实边界规则。
- 缺口：缺少轻量文档巡检，把重复命令行、已完成路线残留在当前待办、实验性能力表述过满等问题一起收口。
- 建议方案：做一轮文档-only OpenSpec 或小修，去重 README，检查 `server`、`app`、多用户、富文本、云端、实时协作相关措辞，确保未实现能力只出现在 roadmap 或边界说明中。
- 涉及文件/模块：`README.md`、`docs/commands.md`、`docs/quickstart.md`、`docs/tech/todo-index.md`。
- 验收标准：高频命令无重复；README 不承诺账号、云端、完整 SaaS、真实 worker 或富文本；`git diff --check` 与 `npm run check:changes` 通过。
- 参考项目/资料：`openspec/changes/align-doc-fact-boundaries`。
- 不做/边界：不新增产品能力。
- 完成记录：`dedupe-readme-command-fact-boundaries` 已去掉 README 高频命令表中的重复 `storyspec server` 和 `storyspec reference:reverse` 行，并新增 README 文档回归测试，确保 App/Server 行继续标注账号、云端、完整 SaaS、真实 worker、数据库全量接入和富文本编辑器边界。

## 完成同步

- 完成任一 P0 任务后更新 [online-app-platform-roadmap.md](online-app-platform-roadmap.md) 和 [todo-index.md](todo-index.md) 的下一步描述。
- 若命令、构建或用户文档发生真实变化，按项目规则补 `changes/*.md`。
