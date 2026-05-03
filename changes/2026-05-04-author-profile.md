---
change_type: minor
scope: cli,templates,memory,docs,tests
---

# 作者画像轻量采样与回填

## CLI 行为

- 新增 `storyspec author-profile`，支持初始化轻量偏好采样、查看画像、确认、废弃、忽略和清空偏好条目。
- 首次采样默认最多 4 个可跳过问题，写入条目为 `provisional`。
- `story:new`、`next`、`interview` 和 `creative:report` 会读取作者画像并提示回填边界。

## 模板契约

- 新增 `.specify/memory/author-profile.json` 模板。
- `/clarify`、`/specify`、`/plan`、`/write`、`/analyze`、`/context-pack` 会把作者画像视为偏好上下文，不作为故事正典。
- `context:pack` 在画像存在时加入 mustRead，并说明不覆盖当前故事回答。

## 生成产物

- 新增 agent 侧 `author-profile` 命令模板，命令构建产物会同步生成到各 agent integration。
- 新项目会在 `.specify/memory/author-profile.json` 带上空画像结构。
- `upgrade --memory` 会同步 JSON 类型的记忆模板。

## 文档

- README 增加作者画像命令和正典边界说明。
- 新增 `docs/tech/author-profile.md`，记录 schema、生命周期和参考项目借鉴边界。

## 验证

- `npm run build`
- `npm test -- tests/unit/manage-author-profile.test.ts tests/unit/story-onboarding.test.ts tests/unit/interview-story.test.ts tests/unit/creative-report.test.ts tests/unit/manage-context-packs.test.ts`
