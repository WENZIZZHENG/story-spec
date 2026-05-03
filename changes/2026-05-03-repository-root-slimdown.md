---
change_type: none
scope: repository,docs,templates
---

# 仓库根目录瘦身

## CLI 行为

- 无 CLI 行为变化。
- 用户项目仍会通过 `storyspec init` 生成 `.specify/`、`stories/`、`spec/tracking/` 等运行目录。

## 模板契约

- 删除仓库根目录中旧生成副本和样例内容，不改变模板源目录。
- `templates/tracking/` 继续作为 `spec/tracking/` 初始化来源。
- `spec/presets/` 继续作为写作方法预设来源。

## 生成产物

- 删除仓库根目录的 `.specify/` 旧生成副本、`.claude/` 本地配置、`stories/test-story/` 样例故事、`other/` 历史参考材料和重复的 `spec/tracking/` 模板副本。
- 删除过时的 `.github/copilot-instructions.md`，避免继续引用已移除的 `other/spec-kit/AGENTS.md`。
- `.gitignore` 明确忽略本地参考材料、根目录生成项目和 agent 本地配置。

## 验证

- 后续收尾需运行 `npm run build`、`npm test`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`npm run test:smoke` 与 `git diff --check`。
