---
change_type: minor
scope: app,templates,docs
---

# 章节写作通道和小样预览

## CLI 行为

- `storyspec app` 启动时把章节写作通道服务注入本机 App core。
- 本次不新增新的终端子命令；章节小样仍通过 agent 写作入口 `/storyspec-write` / `/write` 执行。
- CLI 启动输出仍不暴露 session token。

## App 行为

- 本机工作台章节入口新增“写作通道”只读视图，按 `outline -> tasks -> scene -> sample -> draft -> review` 展示当前阶段、下一步动作、阻断原因和可复制命令。
- 新增 token 保护的 `GET /api/chapters/lane`，只作用于当前 App session 已打开或创建的项目。
- 写作通道不自动修改正文、tracking、canon 或 tasks；章节小样默认只是确认预览。

## 模板契约

- `/storyspec-write`、通用 `/write` 和章节卡模板新增 `阶段 1.5 - 章节小样`。
- 章节小样是 800-1500 字左右的精简预览稿，像缩略正文而不是纯大纲，用来确认读感、情绪顺序、人物反应、冲突推进、尺度边界和文风方向。
- 小样默认不写入正式正文、不更新 tracking、不进入 canon；只有作者确认或改写小样后，才进入完整章节分块生成。
- JSON 阶段仍保持 `plan / write / finish` 兼容，小样阶段继续使用 `plan`。

## 文档

- README 同步本机工作台章节写作通道、章节小样边界和完整章节写作顺序。
- agent guide 同步“约束卡 -> beat -> 章节小样 -> 完整正文”的章节前置路径。
- 项目优化路线图将 P0 写作链路收紧和章节小样预览归档；后续仍保留 P2 状态语义、项目回流、反向拆解增强和文档收口。

## 生成产物

- 命令模板源变化需要通过 `npm run build:commands` 重新生成 `dist/**`。
- 不手工编辑 `dist/**`。

## 验证

- `npx openspec validate add-chapter-writing-lane-sample-preview --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts tests/unit/build-commands.test.ts tests/unit/authoring-templates.test.ts`
