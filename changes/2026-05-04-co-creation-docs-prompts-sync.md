---
change_type: patch
scope: docs,templates,agent
---

# 同步共创输入文档和 agent 提示词

## CLI 行为

- README、quickstart、workflow 和 commands 文档补充 `storyspec core`、`storyspec ingest`、`storyspec co:create` 在新故事流程中的位置。
- 文档明确长文资料和多条回复可以先进入吸收预览，不必拆成逐题输入。

## 模板契约

- agent 引导协议和 agent contract 现在要求把长文拆成作者已确认、候选和待确认。
- `/clarify`、`/specify`、`/plan` 模板明确 `ingest` / `co:create` 的候选不能绕过确认门禁。

## 生成产物

- 重新生成各 agent integration 命令产物，使新项目中的提示词同步包含长文吸收、核心面板和连续共创入口说明。
- 文档索引补充核心信息检查阶段。

## 验证

- `npm run build:commands`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
