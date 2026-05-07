---
change_type: minor
scope: app,cli,docs
---

# 继续创作回流卡和状态词口径

## CLI 行为

`getProjectStatus` 的结构化结果新增 `resume` 摘要，包含当前状态、推荐下一步、可复制命令、写入模式、状态词表和写入边界。现有 `storyspec status` 文本输出不改变原有主要段落。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/`，也不需要重新生成 agent 命令产物。

## 验证

- `npx openspec validate add-status-resume-lane --strict --json --no-interactive`
- `npx vitest run tests/unit/get-project-status.test.ts`
- `npx vitest run tests/unit/local-app-server.test.ts`
- `npx vitest run tests/unit/local-app-http-server.test.ts`
- `npx vitest run tests/unit/local-app-html.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
