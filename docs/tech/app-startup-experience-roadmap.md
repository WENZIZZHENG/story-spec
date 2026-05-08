# 本机启动体验优化路线图

## 状态

Planned。本文用于承接“项目启动方式是否好用”的后续优化待办，当前只记录待实现项，不代表能力已上线。涉及 CLI 行为、启动参数或公共文档承诺的变更，实施前应先转为 OpenSpec change（建议 ID：`improve-app-startup-experience`）。

## 背景和目标

当前项目已有三类启动路径：

1. 仓库开发启动：`npm run dev`、`npm run build && npm run start`。
2. 安装后 CLI 启动：`storyspec ...`。
3. 本机 Web 工作台：`storyspec app`（默认 `127.0.0.1:43127`，session token 门禁）。

现状可用，但对首次用户存在三个摩擦点：入口辨识成本、异常场景（如端口占用）反馈不足、环境问题缺少一键诊断。本文目标是把“首次启动成功率”和“失败后可恢复性”做成可执行路线。

## 非目标

- 不引入云端部署、多用户账号或数据库。
- 不重做 App 前端框架，不把本机 shell 升级为 SaaS 架构。
- 不改变 preview / confirm / apply 的写入门禁。
- 不把未实现能力提前写入 README 的“已可用能力”。

## P1 近期增强

### P1-1 启动入口分层指引（文档 + CLI 帮助）

- 类型：文档、CLI 引导
- 背景/问题：用户知道有 `storyspec` 和 `storyspec app`，但首次使用时不一定能快速判断“我该用哪种启动方式”。
- 已有基础：`README.md` 已含安装与命令说明；`src/cli.ts` 与现有 command 帮助可承载入口文案。
- 缺口：缺少“按场景启动”的单屏入口说明，CLI 帮助也未突出开发者/普通用户/App 三条路径。
- 建议方案：
  1. 在 `README.md` 增加“按场景启动”段落，明确三条路径及最短命令。
  2. 在 `storyspec --help` 与 `storyspec app --help` 文案中补充“适用场景 + 常见参数”。
  3. 保持 README 与 CLI 帮助口径一致，避免文档和命令描述分叉。
- 涉及文件/模块：`README.md`、`src/cli.ts`、`src/cli/commands/app.command.ts`、相关 help/command tests。
- 验收标准：
  - 首次用户能在 README 一屏内判断使用 CLI 还是 App。
  - `storyspec --help` 能直接看到 `storyspec app` 的定位。
  - `storyspec app --help` 能看到 `--project`、`--no-open`、`--json` 的用途。
- 不做/边界：不新增功能开关，仅优化入口说明和帮助文案。

### P1-2 本机工作台启动韧性（端口占用回退 + 启动结果提示）

- 类型：CLI、App 启动稳定性
- 背景/问题：默认端口被占用时，用户常见体验是启动失败或不清楚如何恢复。
- 已有基础：`storyspec app` 已有本机 server 启动和 JSON 输出能力。
- 缺口：缺少端口占用时的自动回退策略与清晰提示。
- 建议方案：
  1. `storyspec app` 默认尝试 `43127`，占用时按预设范围自动选择可用端口。
  2. 控制台与 `--json` 都输出最终监听地址、是否发生端口回退、访问 URL。
  3. 对无法启动的异常分层提示（端口冲突、权限问题、项目路径问题）。
- 涉及文件/模块：`src/cli/commands/app.command.ts`、`src/app-server/local-app-server.ts`、`tests/smoke/*app*`。
- 验收标准：
  - 默认端口占用时命令可继续启动到备用端口。
  - 用户能明确看到“最终 URL”并成功访问。
  - `--json` 输出包含端口回退信息，便于脚本化消费。
- 不做/边界：不引入远程暴露端口或公网监听；仍只绑定本机地址。

### P1-3 环境自检命令（`storyspec doctor`）

- 类型：CLI、可观测性、故障排查
- 背景/问题：启动失败时，用户缺少统一自检入口，只能手工排查 Node 版本、权限、端口可用性等。
- 已有基础：CLI 命令框架与 `codex-status` 等机器可读输出模式。
- 缺口：没有标准化的“启动前检查/启动失败复盘”命令。
- 建议方案：
  1. 新增 `storyspec doctor` 命令，输出关键检查项（Node 版本、路径权限、端口探测、默认浏览器唤起能力）。
  2. 支持文本与 `--json` 两种输出，便于用户粘贴排障信息。
  3. 与 `storyspec app` 失败提示联动，提示可运行 doctor 继续诊断。
- 涉及文件/模块：`src/cli/commands/*.ts`（新增 doctor command）、`src/cli.ts`、`src/utils/*`、`tests/smoke/*doctor*`。
- 验收标准：
  - `storyspec doctor` 能稳定输出检查结果与建议动作。
  - 常见启动失败可通过 doctor 定位到可执行下一步。
  - JSON 输出字段稳定，可用于自动化脚本或 issue 模板。
- 不做/边界：不自动修复系统配置，仅做检查与建议。

## 建议推进顺序

1. 先做 P1-1（文档与帮助），降低首次上手门槛。
2. 再做 P1-2（端口回退与启动反馈），提升启动成功率。
3. 最后做 P1-3（doctor），收口失败后的排障路径。

## 风险与缓解

- 风险：帮助文案和 README 更新不同步，造成口径分叉。  
  缓解：把 README、`--help`、smoke 用例作为同一批变更提交。
- 风险：端口回退逻辑影响现有脚本依赖固定端口。  
  缓解：保持默认端口优先，JSON 中显式输出最终端口；必要时保留固定端口参数。
- 风险：doctor 字段频繁变动导致自动化不稳定。  
  缓解：先定义最小稳定字段集，再在 changeset 中记录版本化变更。

## 完成同步

- 每个任务进入开发前先创建或关联 OpenSpec change。
- 涉及命令输出、帮助文案或 README 行为承诺变化时，补充 `changes/*.md`。
- 完成后在 [todo-archive.md](todo-archive.md) 归档证据，并从 [todo-index.md](todo-index.md) 更新状态。
