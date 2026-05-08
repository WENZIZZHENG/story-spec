---
change_type: minor
scope: app,cli,docs
---

# 本机启动体验优化

## CLI 行为

- `storyspec app` 在默认端口被占用时会尝试备用端口，并在文本与 `--json` 输出中报告 requested port、actual port、final URL 和是否发生 fallback。
- 新增 `storyspec doctor`，只读检查 Node、Git、项目根、默认 App 端口和浏览器打开能力。
- `storyspec --help` / `storyspec app --help` 增加按场景启动说明，帮助用户区分开发启动、CLI 启动和本机 App 启动。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/`；后续如 CLI help 或命令产物变化，需要重新运行构建与命令生成。

## 验证

- `npx openspec validate improve-app-startup-experience --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-command.test.ts tests/unit/doctor-command.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
