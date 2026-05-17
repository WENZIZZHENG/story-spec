---
change_type: minor
scope: app,docs
---

# 完整 App 故事驾驶舱首批切片

## CLI 行为

- 新增完整 App state contract，把当前项目状态映射为故事驾驶舱、首批页面入口、状态语言、角色能力和协作侧栏摘要。
- 新增本机 App `/api/projects/current/app-state` endpoint，沿用 session token 和已打开项目 allowlist。

## 模板契约

- 无 agent prompt、slash command 模板或用户项目初始化模板变化。

## 生成产物

- 重设计 `storyspec app` 本机 HTML shell 为“工作室控制台”，突出项目/工作区、故事驾驶舱、章节与写作、候选与正典、任务中心和 Preview / Confirm / Apply 边界。
- 该变更不实现云端账号、真实多人实时协作、富文本编辑器或 SaaS 部署。

## 验证

- `npm run check:changes`
- `git diff --check`
