---
change_type: patch
scope: cli,docs
---

# 统一首次创作路径提示

## CLI 行为

- `storyspec init` 的成功提示改为先推荐 `storyspec story:new`、`storyspec next`、`storyspec interview`、`storyspec creative:report`、`storyspec preview specify` 和 `storyspec apply`。
- `storyspec --help` 的使用示例改为可复制的新手主路径，不再把旧的 `/method`、`/style`、`/story`、`/outline` 作为核心入口。
- 空项目 `storyspec status` 改为提示先保存一句灵感，再运行 `storyspec next <故事名>`；已有 idea 的故事改为推荐 `next` 或带 `--premise` 的 `interview`。

## 模板契约

- 无模板契约变化。
- agent 内部命令仍保留，首次引导只调整 CLI 和用户文档的推荐优先级。

## 生成产物

- 无生成产物结构变化。
- 面向新用户的 quickstart、docs index 和创作控制权文档同步为 `story:new -> next -> interview -> creative:report -> preview/apply -> agent plan/tasks/write`。

## 验证

- 已运行 `npm run build`。
- 已运行 `npx vitest run tests/unit/get-project-status.test.ts`。
- 已运行 `npm run check:changes`。
- 已运行 `git diff --check`。
- 已运行 smoke：`node dist/cli.js --help` 检查首次创作主路径。
- 已运行 smoke：临时目录 `storyspec init 新手小说 --agent codex` 后进入项目运行 `storyspec status`，检查空项目建议 `storyspec story:new` 和 `storyspec next`。
