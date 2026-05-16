---
change_type: minor
scope: app-ui,frontend
---

# 独立 Web App Shell 首片

## 背景

完整 App 已有本机 shell 和前端架构契约，但还没有独立前端项目边界。后续登录态、权限 UI、协作审阅、任务中心和 E2E 需要从 `local-app-html.ts` 逐步拆出到独立承载层。

## 变化

- 新增 `apps/web/` 独立前端目录。
- 新增零依赖 `app-shell.ts`，定义首批 route、API client、写入边界和非目标。
- 新增静态 `index.html` 和 `main.ts` 入口，作为后续框架接入前的 web shell 骨架。
- 新增 `tests/unit/independent-web-app-shell.test.ts`，保护 route、token header、fallback 和非目标边界。
- 保留本机 `storyspec app` shell，不替换现有 fallback。

## CLI 行为

无 CLI 行为变化。根 `npm run build` 仍只构建主包；`apps/web` 当前通过独立 `npm run build` 做 `tsc --noEmit` 检查。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-independent-web-app-shell --strict --json --no-interactive`
- `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- `npm run build`（在 `apps/web/`）
- `npm run build`
- `npm run check:changes`
- `git diff --check`
