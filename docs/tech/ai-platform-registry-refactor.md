# AI 平台 Registry 重构记录

## 状态

Accepted

## 背景

CLI 中 AI 平台相关数据曾分散在多个位置：

- `src/cli.ts` 内的 `AI_CONFIGS`
- 初始化时的 AI 目录 switch
- 初始化和升级命令中的构建产物 `sourceMap`
- 升级命令的已安装平台检测
- `src/utils/project.ts` 的平台目录检测列表
- 初始化完成后的命令前缀显示逻辑

这些重复数据让新增平台或调整平台行为时容易漏改。Codex 适配已经暴露出这个问题：新增 prompts、`AGENTS.md`、命令前缀和状态检查需要同步修改多个位置。

## 决策

新增 `src/utils/ai-platforms.ts` 作为 AI 平台配置的单一事实源，集中定义：

- 平台 ID 与类型 `AIPlatformId`
- 平台目录与命令目录
- 构建产物目录
- 显示名称
- slash command 前缀
- 额外初始化目录

`src/cli.ts`、`src/utils/project.ts`、`src/utils/interactive.ts` 改为从该 registry 读取平台信息。

## 非目标

- 不重写 `scripts/build/generate-commands.sh` 的平台矩阵。
- 不改变任何已生成 prompt 的命名规则。
- 不拆分完整 CLI 命令文件；本轮只收敛高重复、高风险的平台配置。

## 影响

正面：

- 新增或修改 AI 平台时，只需优先更新 registry。
- 初始化、升级、检测、显示名称和命令前缀共享同一份数据。
- TypeScript 可在编译期约束平台 ID。

代价：

- `cli.ts` 仍然较大，后续可继续按命令拆分为 `commands/init.ts`、`commands/upgrade.ts`。
- 构建脚本仍有自己的 shell 平台列表，后续可再做 JS/TS 化或从 registry 生成。

## 验证

- `npm run build`
- `npm run build:commands`
- `node dist/cli.js codex-status --json`
- 临时目录 `node dist/cli.js init smoke --ai codex --method three-act --no-git`
