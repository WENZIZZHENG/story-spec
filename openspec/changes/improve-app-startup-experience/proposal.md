## Why

当前 `storyspec app` 已能启动本机 Web 工作台，但首次用户仍难判断开发启动、CLI 启动和 App 启动之间的区别；默认端口被占用时缺少自动回退；启动失败后缺少统一环境自检入口。该 change 激活本机启动体验优化路线，先解决低风险、用户可见的启动成功率和排障问题。

## What Changes

- README 和 CLI help 增加按场景启动说明，明确开发者、普通 CLI 用户、本机 Web 工作台三条路径。
- `storyspec app` 默认端口占用时自动回退到备用端口，并在文本和 `--json` 输出中暴露最终 URL、请求端口和是否回退。
- 新增 `storyspec doctor`，检查 Node、Git、当前项目根、默认 App 端口和浏览器打开能力；支持文本和 `--json` 输出。
- `storyspec app` 启动失败时提示可运行 `storyspec doctor` 排查。

## Non-goals

- 不引入云端、多用户账号、数据库或前端框架。
- 不改变本机 App 的 token、allowlist 或 preview / confirm / apply 门禁。
- 不自动修复系统配置、端口占用或浏览器设置。
- 不手工编辑 `dist/**`。

## Impact

影响范围包括 `src/cli/commands/app.command.ts`、新增 doctor 命令模块、`src/cli/program.ts`、README、changeset、待办/归档文档，以及相关 unit/smoke 测试。

## Capabilities

- `app-startup-experience`
